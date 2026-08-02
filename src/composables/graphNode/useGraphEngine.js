import { ref, reactive, computed } from "vue";
import * as d3 from "d3";
import { db } from "./useDatabase";
import { currentTheme } from "./useThemes";
import { searchTerm } from "./useSearch";
import { handleDiscoverClick } from "./useDiscover";
import { fetchAlbums, showAlbumsDropdown } from "./useAlbums";
import { showAddNotePrompt, showAddTypeMenu } from "./useNotes";
import { useAnalytics } from "../useAnalytics";
import {
	generateId,
	cosineSimilarity,
	averageEmbeddings,
	topicsMatch,
	normalizeEmbeddingRecord,
} from "./utils";

// Core data model + the D3 force-graph rendering engine. This is the one
// genuinely-central module of the page: nearly every other composable reads
// from it (clusters/websites/embeddings/graph state) and a few of them
// (useThemes, useSearch, useDiscover, useAlbums) are read back by it in turn
// - those pairs are intentional, safe circular imports (every cross-reference here
// happens inside a function body, never during module evaluation, so load
// order never matters).

const { trackEvent } = useAnalytics();

const SIMILARITY_THRESHOLD = 0.65;
const LOOSE_SIMILARITY_THRESHOLD = 0.45;

// Notes embed their own short, raw, informal text - websites/files embed a
// rich Claude-generated summary paragraph. That register/length mismatch
// means cosine similarity between the two runs lower than you'd intuitively
// expect even for genuinely related content, so notes get their own, more
// lenient threshold rather than reusing the website-to-website one above.
// There's no paired "loose" threshold here - see rankCandidateClusters:
// the lexical (topicsMatch) tier is a fully independent signal now, not
// gated by any minimum embedding similarity.
const NOTE_SIMILARITY_THRESHOLD = 0.5;

// A minimal folded-document glyph for uploaded-file website nodes, drawn in
// a small local coordinate space centered on the node's own (0,0) origin -
// scaled by settings.nodeSize alongside the circle behind it, never by raw
// pixel size, so it stays proportional if the user adjusts node size. Vector,
// not the raster RocusFileIcon*.png assets used elsewhere (those are fixed-
// color PNGs meant for flat <img> tags, not per-theme recoloring inside the
// D3 canvas).
// Same construction as FILE_ICON_PATH, deliberately flipped (fold at the
// bottom-right instead of top-right) so notes read as a distinct silhouette
// from files at a glance, not just a different color.
const NOTE_ICON_PATH =
	"M -4 -4 L 4 -4 L 4 2.5 L 1.5 5 L -4 5 Z " + // sticky-note body (bottom-right corner cut for the fold)
	"M 1.5 2.5 L 1.5 5 L 4 2.5 Z " + // folded corner
	"M -2 -1.5 H 2 " + // text line 1
	"M -2 1 H 1";

const FILE_ICON_PATH =
	"M -4 -5 L 1.5 -5 L 4 -2.5 L 4 5 L -4 5 Z " + // document body (top-right corner cut for the fold)
	"M 1.5 -5 L 1.5 -2.5 L 4 -2.5 Z " + // folded corner
	"M -2 0.5 H 2 " + // text line 1
	"M -2 3 H 2"; // text line 2

// "Who added this" attribution badge color - a deterministic hash of the raw
// added_by identity-key string into an HSL hue (fixed saturation/lightness,
// only the hue varies), so the same person always gets the same color on
// every viewer's screen with no server round-trip or cross-client sync
// needed (it's a pure function of the string itself). A hue rotation over
// 360 degrees collides far less often between two arbitrary identity
// strings than a small fixed palette would (an earlier version using an
// 8-color palette put two real test identities on the exact same color).
function colorForIdentity(identityKey) {
	let hash = 0;
	for (let i = 0; i < identityKey.length; i++) hash = (hash * 31 + identityKey.charCodeAt(i)) | 0;
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 65%, 55%)`;
}

// ---- Core reactive data -----------------------------------------------
export const clusters = ref({});
export const websites = ref({});
export const embeddings = ref({}); // Store embeddings separately for cosine similarity
export const settings = reactive({
	nodeSize: 1.0,
	animationSpeed: 1.0,
	similarityThreshold: 0.5,
});
export const currentAlbum = ref(null);

// History is the second, day-based view of the same switcher dropdown
// Albums lives in (see useAlbums.js / useHistory.js). A cluster's "day" is
// derived from its earliest website's processed_at - not stored on the
// cluster itself - so it's computed on the fly via getClusterDayKey below.
// Switching between the two modes always resets both filters back to "All
// Clusters" (see setDropdownMode) so they never combine into a confusing
// intersection.
const DROPDOWN_MODE_KEY = "rocus-dropdown-mode";
const storedDropdownMode = localStorage.getItem(DROPDOWN_MODE_KEY);
export const dropdownMode = ref(
	storedDropdownMode === "history" || storedDropdownMode === "shared" ? storedDropdownMode : "albums"
);
export const currentHistoryDay = ref(null);

// 'shared' is a third tab (Albums | Shared | History) but NOT a content
// filter like the other two - it's just a picker view offering two lists
// ("Shared" albums you own, "Shared with me" from others) to navigate from.
// Switching to/from it deliberately does NOT reset currentAlbum/
// currentHistoryDay or reload graph data - the view underneath stays
// exactly as it was until the user actually clicks something inside it.
export function setDropdownMode(mode) {
	if (mode !== "albums" && mode !== "history" && mode !== "shared") return;
	if (dropdownMode.value === mode) return;

	dropdownMode.value = mode;
	localStorage.setItem(DROPDOWN_MODE_KEY, mode);

	if (mode !== "albums" && mode !== "history") return;

	currentAlbum.value = null;
	currentHistoryDay.value = null;

	loadData().then(() => {
		if (simulation) {
			simulation.nodes(graphData.nodes);
			simulation.force("link").links(graphData.links);
			simulation.alpha(1).restart();
			renderGraph();
		}
	});
}

// Local calendar day (not UTC) - "the day the user created this" should
// match what their own clock said at the time, not a server-side cutoff.
export function dayKeyFromISO(isoString) {
	const d = new Date(isoString);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A cluster belongs to exactly one day: whenever its first (earliest-
// processed) website was added, mirroring how a cluster belongs to exactly
// one album. Returns null if none of its websites have a processed_at yet.
export function getClusterDayKey(cluster) {
	let earliest = null;
	for (const websiteId of cluster.websites || []) {
		const site = websites.value[websiteId];
		if (!site?.processed_at) continue;
		if (!earliest || site.processed_at < earliest) earliest = site.processed_at;
	}
	return earliest ? dayKeyFromISO(earliest) : null;
}

// ---- Graph/DOM refs & UI state -----------------------------------------
export const graphContainer = ref(null);
export const tooltip = ref(null);
export const isLoading = ref(false);
export const explodedNode = ref(null);
export const selectedWebsite = ref(null);
export const stickyNoteStyle = ref({});
export const websiteDetails = ref(null);
export let showConnections = ref(true);

export const contextCluster = ref(null);
export const showContextMenu = ref(false);
export const contextMenuStyle = ref({});
export const showWebsiteContextMenu = ref(false);
export const websiteContextNode = ref(null);

// ---- Non-reactive D3/engine state --------------------------------------
// Plain (non-ref) module bindings, exactly like the original component's
// closure variables. Only this file ever reassigns them; every other
// composable that needs them only reads them or calls methods on them.
export let graphData;
let rawClusters = [];
export let rawSimilarities = {};
export let simulation;
export let svg, container, zoom;
let websiteNodes = [];

// Sticky note dragging
let isDraggingSticky = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// ==============================================
// DATA FETCH / PERSISTENCE
// ==============================================
export async function fetchClusters() {
	try {
		if (!db) return [];

		const tx = db.transaction("clusters", "readonly");
		const store = tx.objectStore("clusters");
		const request = store.getAll();

		const selectedAlbumId = currentAlbum.value ? currentAlbum.value.id : null;
		const selectedDayKey = currentHistoryDay.value;
		console.log("Fetching clusters for album ID:", selectedAlbumId, "day:", selectedDayKey);


		return new Promise((resolve, reject) => {
			request.onsuccess = () => {

				const clustersArray = request.result

					.filter(cluster => {
						if (selectedAlbumId !== null && cluster.album_id !== selectedAlbumId) {
							return false;
						}
						if (selectedDayKey !== null && getClusterDayKey(cluster) !== selectedDayKey) {
							return false;
						}
						return true; //returns all the clusters if no album/day filter matches
					})
					.map(cluster => {
						const websitesList = cluster.websites
							.map(id => websites.value[id])
							.filter(Boolean)
							.map(website => ({
								id: website.id,
								title: website.title,
								url: website.url,
								domain: website.domain,
								processed_at: website.processed_at,
								is_file: !!website.is_file,
								file_id: website.file_id || null,
								is_note: !!website.is_note,
								note_text: website.note_text || null,
								added_by: website.added_by || null
							}));

						return {
							cluster_id: cluster.id,
							topic: cluster.topic,
							website_count: websitesList.length,
							websites: websitesList,
							similar_links: cluster.similar_links || {},
							is_notes_cluster: !!cluster.is_notes_cluster,
							notes_hub_links: cluster.notes_hub_links || []
						};
					});

				resolve(clustersArray);
			};

			request.onerror = () => reject(request.error);
		});


	} catch (error) {
		console.error("❌ Error fetching clusters:", error);
		return [];
	}
}

export async function fetchSimilarities() {
	try {
		if (!db) return {};

		const similarities = {};

		// Get the active album/day filter
		const activeAlbumId = currentAlbum.value ? currentAlbum.value.id : null;
		const activeDayKey = currentHistoryDay.value;

		// Only calculate similarities for clusters in the current album/day view
		let clusterIds = Object.keys(clusters.value);
		if (activeAlbumId !== null) {
			clusterIds = clusterIds.filter(id => clusters.value[id].album_id === activeAlbumId);
		}
		if (activeDayKey !== null) {
			clusterIds = clusterIds.filter(id => getClusterDayKey(clusters.value[id]) === activeDayKey);
		}

		// FIRST: Preserve manual connections
		for (const sourceClusterId of clusterIds) {
			const sourceCluster = clusters.value[sourceClusterId];
			if (!sourceCluster) continue;

			similarities[sourceClusterId] = {};

			// Add manual connections with similarity of 1.0
			if (sourceCluster.manual_connections && sourceCluster.manual_connections.length > 0) {
				for (const targetId of sourceCluster.manual_connections) {
					if (clusterIds.includes(targetId)) {
						similarities[sourceClusterId][targetId] = 1.0;
					}
				}
			}
		}

		// THEN: Calculate embedding-based similarities
		for (const sourceClusterId of clusterIds) {
			const sourceCluster = clusters.value[sourceClusterId];
			if (!sourceCluster || !sourceCluster.websites.length) continue;
			// The Notes hub's member embeddings are semantically unrelated to
			// each other (a grab-bag of orphan notes) - its average embedding
			// would produce meaningless accidental links to unrelated topics.
			// Its only connections are the deliberate dashed hub-links added
			// in processApiData().
			if (sourceCluster.is_notes_cluster) continue;

			const sourceWebsiteIds = sourceCluster.websites;
			const sourceEmbeddings = sourceWebsiteIds
				.map((id) => embeddings.value[id]?.v)
				.filter(Boolean);

			if (sourceEmbeddings.length === 0) continue;

			const sourceAvgEmbedding = averageEmbeddings(sourceEmbeddings);

			for (const targetClusterId of clusterIds) {
				if (sourceClusterId === targetClusterId) continue;

				// Skip if manual connection already exists
				if (similarities[sourceClusterId][targetClusterId]) continue;

				const targetCluster = clusters.value[targetClusterId];
				if (!targetCluster || !targetCluster.websites.length) continue;
				if (targetCluster.is_notes_cluster) continue;

				const targetWebsiteIds = targetCluster.websites;
				const targetEmbeddings = targetWebsiteIds
					.map((id) => embeddings.value[id]?.v)
					.filter(Boolean);

				if (targetEmbeddings.length === 0) continue;

				const targetAvgEmbedding = averageEmbeddings(targetEmbeddings);
				const similarity = cosineSimilarity(sourceAvgEmbedding, targetAvgEmbedding);

				if (similarity >= settings.similarityThreshold) {
					similarities[sourceClusterId][targetClusterId] = similarity;
				}
			}
		}

		return similarities;
	} catch (error) {
		console.error("❌ Error calculating similarities:", error);
		return {};
	}
}

export async function fetchWebsiteDetails(websiteId) {
	try {
		console.log("Fetching website details for:", websiteId);

		// Prefer the in-memory ref - it's already fully populated with every
		// field this function returns, regardless of whether it got there via
		// loadFromIndexedDB() (local/dashboard mode) or loadSharedGraphData()
		// (shared-view mode, from the server). The IndexedDB read below only
		// ever succeeds for local mode - a guest/collaborator's browser has no
		// local record for someone else's website at all, which is why
		// descriptions/summaries never rendered in the shared view. This is
		// also a strict improvement for local mode: skips a redundant async
		// IndexedDB round-trip on the common path.
		const inMemory = websites.value[websiteId];
		if (inMemory) {
			return {
				website: {
					id: inMemory.id,
					url: inMemory.url,
					title: inMemory.title,
					domain: inMemory.domain,
					ai_summary: inMemory.ai_summary,
					topic: inMemory.topic,
					search_query: inMemory.search_query,
					processed_at: inMemory.processed_at,
					metadata: inMemory.metadata,
				},
			};
		}

		if (!db) return null;

		const tx = db.transaction("websites", "readonly");

		const store = tx.objectStore("websites");

		return new Promise((resolve, reject) => {
			const request = store.get(websiteId);

			request.onsuccess = () => {
				const website = request.result;

				if (website) {
					resolve({
						website: {
							id: website.id,

							url: website.url,

							title: website.title,

							domain: website.domain,

							ai_summary: website.ai_summary,

							topic: website.topic,

							search_query: website.search_query,

							processed_at: website.processed_at,

							metadata: website.metadata,
						},
					});
				} else {
					resolve(null);
				}
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error("❌ Error fetching website details:", error);

		return null;
	}
}

export async function saveToIndexedDB() {
	if (!db) return;

	try {
		const tx = db.transaction(
			["websites", "clusters", "embeddings"],
			"readwrite"
		);

		const websiteStore = tx.objectStore("websites");
		await new Promise((resolve, reject) => {
			const r = websiteStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const website of Object.values(websites.value)) {
			try {
				// Convert to plain object by JSON serialization or manual copy
				const plainWebsite = JSON.parse(JSON.stringify(website));

				await new Promise((resolve, reject) => {
					const r = websiteStore.put(plainWebsite);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error("❌ WEBSITE FAILED:", website, err);
			}
		}

		const clusterStore = tx.objectStore("clusters");
		await new Promise((resolve, reject) => {
			const r = clusterStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const cluster of Object.values(clusters.value)) {
			try {
				// Convert to plain object
				const plainCluster = JSON.parse(JSON.stringify(cluster));

				await new Promise((resolve, reject) => {
					const r = clusterStore.put(plainCluster);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error("❌ CLUSTER FAILED:", cluster, err);
			}
		}

		const embeddingStore = tx.objectStore("embeddings");
		await new Promise((resolve, reject) => {
			const r = embeddingStore.clear();
			r.onsuccess = resolve;
			r.onerror = () => reject(r.error);
		});

		for (const [id, embedding] of Object.entries(embeddings.value)) {
			try {
				const plainEmbedding = {
					id,
					embedding: JSON.parse(JSON.stringify(embedding)),
				};
				await new Promise((resolve, reject) => {
					const r = embeddingStore.put(plainEmbedding);
					r.onsuccess = resolve;
					r.onerror = () => reject(r.error);
				});
			} catch (err) {
				console.error(`❌ EMBEDDING FAILED [${id}]`, embedding, err);
			}
		}

		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve;
			tx.onerror = () => reject(tx.error);
			tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
		});

		console.log("✨ IndexedDB Save Complete");
	} catch (err) {
		console.error("🔥 FATAL IndexedDB SAVE ERROR:", err);
	}
}

export async function loadFromIndexedDB() {
	if (!db) return;

	try {
		// Load websites
		const websiteTx = db.transaction("websites", "readonly");
		const websiteStore = websiteTx.objectStore("websites");
		const websiteRequest = websiteStore.getAll();

		websiteRequest.onsuccess = () => {
			for (const website of websiteRequest.result) {
				websites.value[website.id] = website;
			}
		};

		// Load clusters
		const clusterTx = db.transaction("clusters", "readonly");
		const clusterStore = clusterTx.objectStore("clusters");
		const clusterRequest = clusterStore.getAll();

		clusterRequest.onsuccess = () => {
			for (const cluster of clusterRequest.result) {
				clusters.value[cluster.id] = cluster;
			}
		};

		// Load embeddings
		const embeddingTx = db.transaction("embeddings", "readonly");
		const embeddingStore = embeddingTx.objectStore("embeddings");
		const embeddingRequest = embeddingStore.getAll();

		embeddingRequest.onsuccess = () => {
			for (const item of embeddingRequest.result) {
				embeddings.value[item.id] = normalizeEmbeddingRecord(item.embedding);
			}
		};

		console.log("✅ Loaded data from IndexedDB");
	} catch (err) {
		console.error("Error loading from IndexedDB:", err);
	}
}

export async function deleteWebsite(websiteId) {
	if (isReadOnlySharedView.value) return;
	// Remove from clusters
	for (const cluster of Object.values(clusters.value)) {
		const index = cluster.websites.indexOf(websiteId);
		if (index > -1) {
			cluster.websites.splice(index, 1);

			// Delete empty clusters
			if (cluster.websites.length === 0) {
				delete clusters.value[cluster.id];
			}
		}
	}

	// Remove website and embedding
	delete websites.value[websiteId];
	delete embeddings.value[websiteId];

	await saveToIndexedDB();
	console.log(`🗑️ Deleted website: ${websiteId}`);
}

// ==============================================
// CLUSTERING
// ==============================================
export function findSimilarWebsites(targetEmbedding, excludeId = null, albumId = null) {
	const similarities = [];

	for (const [websiteId, embedding] of Object.entries(embeddings.value)) {
		if (excludeId && websiteId === excludeId) continue;

		const website = websites.value[websiteId];
		if (!website || website.album_id !== albumId) continue;

		const similarity = cosineSimilarity(targetEmbedding, embedding.v);
		similarities.push({ websiteId, similarity });
	}

	return similarities.sort((a, b) => b.similarity - a.similarity);
}

export function assignToCluster(websiteId, topic, embedding, searchQuery, albumId = null) {
	const similarWebsites = findSimilarWebsites(embedding, websiteId, albumId);

	for (const { websiteId: similarId, similarity } of similarWebsites) {
		for (const [clusterId, cluster] of Object.entries(clusters.value)) {
			if (cluster.album_id !== albumId) continue;

			if (cluster.websites.includes(similarId)) {
				const clusterTopic = cluster.topic;

				if (similarity >= SIMILARITY_THRESHOLD) {
					if (!cluster.websites.includes(websiteId)) {
						cluster.websites.push(websiteId);
					}
					console.log(`🔗 Added to cluster ${clusterId} in album ${albumId || 'All Clusters'}`);

					return clusterId;
				}

				if (
					similarity >= LOOSE_SIMILARITY_THRESHOLD &&
					topicsMatch(topic, clusterTopic)
				) {
					if (!cluster.websites.includes(websiteId)) {
						cluster.websites.push(websiteId);
					}
					console.log(`🔗 Added to cluster ${clusterId} (loose + topic)`);
					return clusterId;
				}
			}
		}
	}

	const newClusterId = generateId();
	clusters.value[newClusterId] = {
		id: newClusterId,
		topic: topic,
		websites: [websiteId],
		similar_links: {},
		manual_connections: [],
		album_id: albumId,
	};

	console.log(`🆕 Created new cluster: ${newClusterId} in album ${albumId || 'All Clusters'}`);
	return newClusterId;
}

// Finds (or lazily creates) the one shared per-album "Notes" cluster - a
// permanent catch-all bucket for notes that don't semantically match any
// real topic, and the hub every topic-with-a-linked-note gets a dashed
// connector to. Never matched into via similarity (see assignNoteToCluster),
// only ever reached directly here.
function findOrCreateNotesCluster(albumId) {
	const existing = Object.values(clusters.value).find(
		(c) => c.album_id === albumId && c.is_notes_cluster
	);
	if (existing) return existing.id;

	const id = generateId();
	clusters.value[id] = {
		id,
		topic: "Notes",
		websites: [],
		similar_links: {},
		manual_connections: [],
		album_id: albumId,
		is_notes_cluster: true,
		notes_hub_links: [],
	};
	console.log(`🆕 Created Notes hub cluster: ${id} in album ${albumId || 'All Clusters'}`);
	return id;
}

// Records the dashed connector between a topic cluster and the Notes hub -
// bidirectional and deduped, mirroring the existing manual_connections
// convention. A no-op on repeat calls once the pair is already linked, so
// multiple notes landing in the same topic cluster just re-confirm one link.
function linkClusterToNotesHub(topicClusterId, albumId) {
	const notesClusterId = findOrCreateNotesCluster(albumId);
	const notesCluster = clusters.value[notesClusterId];
	const topicCluster = clusters.value[topicClusterId];

	if (!notesCluster.notes_hub_links.includes(topicClusterId)) {
		notesCluster.notes_hub_links.push(topicClusterId);
	}
	if (!topicCluster.notes_hub_links) topicCluster.notes_hub_links = [];
	if (!topicCluster.notes_hub_links.includes(notesClusterId)) {
		topicCluster.notes_hub_links.push(notesClusterId);
	}
}

// Notes go through the same embedding pipeline as websites, but never spawn
// their own singleton cluster the way assignToCluster does - a note either
// joins a real topic cluster it strictly matches (only SIMILARITY_THRESHOLD,
// no loose+topic-match tier, since notes have no Claude-derived topic to
// loosely match on), or falls into the shared Notes hub.
// Read-only: ranks every real topic cluster (never the Notes hub itself) in
// the given album against a note's embedding + raw text, for both the
// actual assignment below AND the live suggestion dropdown in the note
// modal - the preview and the real save must use the exact same logic, or
// the preview would lie about what's actually going to happen.
//
// Tier 1: cluster-centroid cosine similarity clears the (lenient, note-
// specific) strict bar on its own. Tier 2: topicsMatch(noteText, cluster.topic)
// - lexical/keyword overlap - qualifies independently, with NO minimum
// embedding similarity required. A short note compared against a cluster
// centroid built from full paragraph summaries can embed low even when the
// topic word match is exact and unambiguous (e.g. "warehousing" vs a
// "Warehouse" topic) - gating a real keyword match behind a semantic-
// similarity floor was punishing exactly the case this whole feature exists
// for. Tier 1 still outranks tier 2 when both exist.
export function rankCandidateClusters(embedding, noteText, albumId = null) {
	const candidates = [];

	for (const cluster of Object.values(clusters.value)) {
		if (cluster.album_id !== albumId) continue;
		if (cluster.is_notes_cluster) continue;

		const memberEmbeddings = cluster.websites
			.map((id) => embeddings.value[id]?.v)
			.filter(Boolean);
		if (memberEmbeddings.length === 0) continue;

		const centroid = averageEmbeddings(memberEmbeddings);
		const similarity = cosineSimilarity(embedding, centroid);

		if (similarity >= NOTE_SIMILARITY_THRESHOLD) {
			candidates.push({ clusterId: cluster.id, topic: cluster.topic, score: similarity, tier: 1 });
		} else if (topicsMatch(noteText, cluster.topic)) {
			candidates.push({ clusterId: cluster.id, topic: cluster.topic, score: similarity, tier: 2 });
		}
	}

	return candidates.sort((a, b) => a.tier - b.tier || b.score - a.score).slice(0, 3);
}

// Sentinel for "the user explicitly picked the Notes hub" in the modal -
// distinct from a real cluster id, since the hub may not exist yet (it's
// created lazily) at the moment the chip is clicked.
export const NOTES_HUB_SENTINEL = '__notes_hub__';

export function assignNoteToCluster(noteWebsiteId, embedding, albumId = null, noteText = '', forcedClusterId = null) {
	if (forcedClusterId === NOTES_HUB_SENTINEL) {
		const notesClusterId = findOrCreateNotesCluster(albumId);
		if (!clusters.value[notesClusterId].websites.includes(noteWebsiteId)) {
			clusters.value[notesClusterId].websites.push(noteWebsiteId);
		}
		console.log(`🗒️ Note pinned to the Notes hub by user choice`);
		return notesClusterId;
	}

	// User picked a suggestion in the modal - honor it directly rather than
	// re-running the ranking.
	if (forcedClusterId && clusters.value[forcedClusterId]) {
		const cluster = clusters.value[forcedClusterId];
		if (!cluster.websites.includes(noteWebsiteId)) {
			cluster.websites.push(noteWebsiteId);
		}
		if (!cluster.is_notes_cluster) {
			linkClusterToNotesHub(forcedClusterId, albumId);
		}
		console.log(`🔗 Note pinned to cluster ${forcedClusterId} by user choice`);
		return forcedClusterId;
	}

	const [topCandidate] = rankCandidateClusters(embedding, noteText, albumId);
	if (topCandidate) {
		const cluster = clusters.value[topCandidate.clusterId];
		if (!cluster.websites.includes(noteWebsiteId)) {
			cluster.websites.push(noteWebsiteId);
		}
		linkClusterToNotesHub(topCandidate.clusterId, albumId);
		console.log(`🔗 Note added to cluster ${topCandidate.clusterId}, linked to Notes hub`);
		return topCandidate.clusterId;
	}

	const notesClusterId = findOrCreateNotesCluster(albumId);
	if (!clusters.value[notesClusterId].websites.includes(noteWebsiteId)) {
		clusters.value[notesClusterId].websites.push(noteWebsiteId);
	}
	console.log(`🗒️ Note fell into the Notes hub ${notesClusterId} (no strict match)`);
	return notesClusterId;
}

// ==============================================
// GRAPH DATA LOADING
// ==============================================
export function processApiData(clustersData, similarities) {
	console.log("Processing Cluster data:", { clustersData, similarities });

	const nodes = clustersData.map((cluster, index) => {
		const baseSize = Math.max(15, Math.min(40, cluster.website_count * 8 + 15));

		return {
			id: cluster.cluster_id,

			cluster_id: cluster.cluster_id,

			topic: cluster.topic,

			website_count: cluster.website_count,

			websites: cluster.websites || [],

			similar_links: cluster.similar_links || [],

			is_notes_cluster: !!cluster.is_notes_cluster,

			notes_hub_links: cluster.notes_hub_links || [],

			size: baseSize,

			baseSize: baseSize,

			type: "cluster",

			x: Math.cos((index * 2 * Math.PI) / clustersData.length) * 300,

			y: Math.sin((index * 2 * Math.PI) / clustersData.length) * 300,

			metadata: {
				description: `Cluster containing ${cluster.website_count} websites about ${cluster.topic}`,

				tags: ["cluster", cluster.topic.toLowerCase().replace(/\s+/g, "-")],
			},
		};
	});

	const links = [];

	Object.entries(similarities).forEach(([sourceId, targets]) => {
		Object.entries(targets).forEach(([targetId, similarity]) => {
			if (
				similarity >= settings.similarityThreshold &&
				!links.some(
					(l) =>
						(l.source === sourceId && l.target === targetId) ||
						(l.source === targetId && l.target === sourceId)
				)
			) {
				links.push({
					source: sourceId,

					target: targetId,

					similarity: similarity,

					strength: similarity,

					type: "cluster-link",
				});
			}
		});
	});

	// Dashed hub connectors from the "Notes" cluster to every topic cluster
	// that picked up a linked note - not similarity-derived (the Notes hub is
	// deliberately excluded from fetchSimilarities' embedding pass, since its
	// member notes are semantically unrelated to each other), so these are
	// generated here from notes_hub_links instead.
	const nodeIds = new Set(nodes.map((n) => n.id));
	clustersData.forEach((cluster) => {
		if (!cluster.is_notes_cluster) return;
		(cluster.notes_hub_links || []).forEach((topicClusterId) => {
			if (!nodeIds.has(topicClusterId)) return; // topic cluster not in this album/day view
			const already = links.some(
				(l) =>
					(l.source === cluster.cluster_id && l.target === topicClusterId) ||
					(l.source === topicClusterId && l.target === cluster.cluster_id)
			);
			if (already) return;
			links.push({ source: cluster.cluster_id, target: topicClusterId, type: "notes-hub-link" });
		});
	});

	console.log("✅ Processed data:", {
		nodeCount: nodes.length,

		linkCount: links.length,
	});

	return { nodes, links };
}

// Set while the current view is a shared graph (fetched from the server)
// rather than this browser's own IndexedDB - null in normal single-player
// use. Read by loadData()'s callers to decide which loader to invoke, and by
// the sharing UI to know whether "add a node" should also push to the server.
export const remoteGraphId = ref(null);
export const remoteGraphRole = ref(null); // 'owner' | 'edit' | 'view' | 'guest' | null
export const remoteGraphFrozen = ref(false);

// The owner's own /dashboard equivalent of remoteGraphId: set (by
// useSharing.js) whenever the currently-selected local album is actively
// shared, null otherwise. Declared here rather than in useSharing.js - which
// owns every read/write of it - specifically so this file's own rendering
// code (renderGraph()) can read it directly without a static import back to
// useSharing.js, which would recreate the circular-eval-order crash this
// project has hit before (useSharing.js already imports heavily from this
// file; the reverse direction is never safe at module-eval time).
export const activeShareGraphId = ref(null);

// Single source of truth for "this viewer should not be able to change
// anything" - a view-only collaborator or an anonymous guest on a shared
// graph. Local/single-player use (remoteGraphId null) and owner/edit
// collaborators are never read-only. Used to hide/disable every mutating
// control in GraphNode.vue (Albums/History switching, theme, uploads,
// settings, note-creation gestures, website deletion) - previously only the
// Share button itself checked remoteGraphRole, which meant a guest or
// view-only collaborator could still use every other control in the app.
export const isReadOnlySharedView = computed(
	() => !!remoteGraphId.value && (remoteGraphRole.value === "guest" || remoteGraphRole.value === "view")
);

// Resolves the album new content (a note, an uploaded file) should be tagged
// with. currentAlbum.value is correct on the owner's own /dashboard, but
// loadSharedGraphData() deliberately sets it to null in shared/remote view
// mode - a shared view isn't scoped to any of THIS browser's own local
// albums. Without this fallback, anything added from within a shared view
// got tagged album_id: null, which matches none of the real clusters
// mirrored over from the owner's actual album (they all carry the owner's
// real, non-null album id) - the content would still reach the owner via the
// live-sync push, but arrive invisible, filed under an album nobody's
// dashboard ever looks at. Every cluster in a shared-view session
// originated from one gatherAlbumNodes() call for one specific album, so
// they all already carry that same real id - this just reads it back
// instead of assuming null.
export function effectiveAlbumId() {
	if (currentAlbum.value?.id) return currentAlbum.value.id;
	if (remoteGraphId.value) {
		const anyCluster = Object.values(clusters.value).find((c) => c.album_id);
		if (anyCluster) return anyCluster.album_id;
	}
	return null;
}

// Mirrors fetchClusters()'s website-summarizing shape exactly, but reads from
// the in-memory refs directly instead of IndexedDB - this is what lets
// processApiData()/fetchSimilarities() stay completely unaware of whether
// the data they're shaping came from a shared graph or a local one.
function clusterRecordToClusterData(cluster) {
	const websitesList = (cluster.websites || [])
		.map((id) => websites.value[id])
		.filter(Boolean)
		.map((website) => ({
			id: website.id,
			title: website.title,
			url: website.url,
			domain: website.domain,
			processed_at: website.processed_at,
			is_file: !!website.is_file,
			file_id: website.file_id || null,
			is_note: !!website.is_note,
			note_text: website.note_text || null,
			added_by: website.added_by || null,
		}));

	return {
		cluster_id: cluster.id,
		topic: cluster.topic,
		website_count: websitesList.length,
		websites: websitesList,
		similar_links: cluster.similar_links || {},
		is_notes_cluster: !!cluster.is_notes_cluster,
		notes_hub_links: cluster.notes_hub_links || [],
	};
}

// The remote counterpart to loadData(): same shape (fills websites/clusters/
// embeddings, then runs the identical processApiData()/fetchSimilarities()
// pipeline), just sourced from GET /api/shared/:graphId instead of
// IndexedDB. This is the graph-store abstraction boundary described in the
// plan doc - renderGraph()/centerView()/drag() never change, they only ever
// see the resulting graphData either way.
export async function loadSharedGraphData(graphId, { API_BASE, credentials = "include" } = {}) {
	isLoading.value = true;
	try {
		const res = await fetch(`${API_BASE}/api/shared/${graphId}`, { credentials });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.error || `load_failed_${res.status}`);
		}
		const payload = await res.json();

		remoteGraphId.value = graphId;
		remoteGraphRole.value = payload.role;
		remoteGraphFrozen.value = !!payload.frozen;

		// A shared graph's clusters carry the ORIGINAL owner's album_id, which is
		// meaningless on a collaborator's own device - clearing the local
		// album/day filters means fetchSimilarities()'s own album/day filtering
		// (it reads these same refs) doesn't accidentally exclude everything.
		currentAlbum.value = null;
		currentHistoryDay.value = null;

		websites.value = {};
		clusters.value = {};
		embeddings.value = {};

		for (const node of payload.nodes || []) {
			if (node.type === "website") {
				websites.value[node.id] = node.data;
				if (node.data?.embedding) embeddings.value[node.id] = node.data.embedding;
			} else if (node.type === "cluster") {
				clusters.value[node.id] = node.data;
			}
		}

		const clustersData = Object.values(clusters.value).map(clusterRecordToClusterData);
		rawClusters = clustersData;

		const similarities = await fetchSimilarities();
		rawSimilarities = similarities;

		graphData = processApiData(clustersData, similarities);

		return payload;
	} finally {
		isLoading.value = false;
	}
}

// Called when leaving a shared-graph view (navigating back to the normal
// local dashboard) so loadData()'s own IndexedDB-backed path takes over
// again cleanly next time it runs.
export function clearRemoteGraphState() {
	remoteGraphId.value = null;
	remoteGraphRole.value = null;
	remoteGraphFrozen.value = false;
}

export async function loadData() {
	isLoading.value = true;

	try {
		console.log("🔄 Loading data from IndexedDB...");

		// First load websites and embeddings
		await loadFromIndexedDB();

		// Then fetch processed clusters (already filtered by album in fetchClusters)
		const [clustersData, albumsData] = await Promise.all([
			fetchClusters(), // This is already filtered by currentAlbum
			fetchAlbums(),
		]);

		console.log("📊 Data loaded:", {
			clusterCount: clustersData.length,
			albumCount: Object.keys(albumsData).length,
			currentAlbum: currentAlbum.value?.name || 'All Clusters'
		});

		// UPDATE rawClusters with filtered data
		rawClusters = clustersData;

		// Calculate similarities ONLY for the filtered clusters
		const similarities = await fetchSimilarities();
		rawSimilarities = similarities;

		console.log("Similarities calculated:", Object.keys(similarities).length);

		// Process the filtered data into graph format
		graphData = processApiData(clustersData, similarities);

		if (graphData.nodes.length === 0) {
			console.warn("⚠️ No clusters found for this album, showing empty state");
			graphData = { nodes: [], links: [] };
		} else {
			console.log("✅ Graph data ready:", graphData);
		}
	} catch (error) {
		console.error("❌ Error loading data:", error);
		graphData = { nodes: [], links: [] };
	} finally {
		isLoading.value = false;
	}
}

export function generatePlaceholderData() {
	console.log("🔄 Generating placeholder data...");
	const categories = [
		"Ideas",
		"Concepts",
		"Projects",
		"Notes",
		"Research",
		"Tasks",
	];
	const nodes = [];
	const nodeCount = 6;

	const nodeNames = [
		"Machine Learning",
		"Artificial Intelligence",
		"Data Science",
		"Web Development",
		"Cloud Computing",
		"Cybersecurity",
	];

	for (let i = 0; i < nodeCount; i++) {
		const category = categories[Math.floor(Math.random() * categories.length)];
		const baseSize = Math.random() * 15 + 15;
		nodes.push({
			id: `placeholder-${i}`,
			cluster_id: `placeholder-${i}`,
			topic: nodeNames[i] || `Cluster ${i + 1}`,
			website_count: Math.floor(Math.random() * 5) + 1,
			websites: [],
			similar_links: [],
			size: baseSize,
			baseSize: baseSize,
			type: "cluster",
			x: Math.cos((i * 2 * Math.PI) / nodeCount) * 200,
			y: Math.sin((i * 2 * Math.PI) / nodeCount) * 200,
			metadata: {
				description: `Placeholder cluster for ${nodeNames[i] || "various topics"
					}`,
				tags: [category.toLowerCase(), "placeholder"],
			},
		});
	}

	const links = [];
	for (let i = 0; i < nodeCount - 1; i++) {
		if (Math.random() < 0.6) {
			links.push({
				source: nodes[i].id,
				target: nodes[i + 1].id,
				similarity: 0.5 + Math.random() * 0.3,
				strength: 0.5,
				type: "cluster-link",
			});
		}
	}

	return { nodes, links };
}

export async function refreshData() {
	console.log("🔄 Refreshing data...");
	selectedWebsite.value = null;
	explodedNode.value = null;
	await loadData();
	if (simulation) {
		simulation.nodes(graphData.nodes);
		simulation.force("link").links(graphData.links);
		simulation.alpha(1).restart();
		renderGraph();
	}
}

// Same re-tick/re-render pattern as refreshData(), just sourced from
// loadSharedGraphData() instead of the IndexedDB-backed loadData() - always a
// full authoritative reload rather than an incremental patch, since a shared
// graph's WebSocket messages only ever say "something changed," not what.
export async function refreshRemoteGraph(API_BASE) {
	if (!remoteGraphId.value) return;
	selectedWebsite.value = null;
	explodedNode.value = null;
	await loadSharedGraphData(remoteGraphId.value, { API_BASE });
	if (simulation) {
		simulation.nodes(graphData.nodes);
		simulation.force("link").links(graphData.links);
		simulation.alpha(1).restart();
		renderGraph();
	}
}

// Re-renders from whatever's already in clusters.value/websites.value (no
// network fetch), honoring currentAlbum/currentHistoryDay - the in-memory
// equivalent of fetchClusters()'s own IndexedDB query+filter, for a shared
// graph's data. loadSharedGraphData() deliberately never persists a shared
// graph to IndexedDB (see its own comment above), so selectHistoryDay()
// calling the ordinary loadData() there queried THIS BROWSER's own local
// IndexedDB store instead - correctly empty/irrelevant on a fresh session,
// which is exactly why the History tab's day badges (built from this same
// in-memory data) showed real counts but clicking one produced nothing.
export async function refreshRemoteGraphView() {
	if (!remoteGraphId.value) return;
	selectedWebsite.value = null;
	explodedNode.value = null;

	const activeAlbumId = currentAlbum.value?.id ?? null;
	const activeDayKey = currentHistoryDay.value;
	const clustersData = Object.values(clusters.value)
		.filter((c) => {
			if (activeAlbumId !== null && c.album_id !== activeAlbumId) return false;
			if (activeDayKey !== null && getClusterDayKey(c) !== activeDayKey) return false;
			return true;
		})
		.map(clusterRecordToClusterData);

	rawClusters = clustersData;
	const similarities = await fetchSimilarities();
	rawSimilarities = similarities;
	graphData = processApiData(clustersData, similarities);

	if (simulation) {
		simulation.nodes(graphData.nodes);
		simulation.force("link").links(graphData.links);
		simulation.alpha(1).restart();
		renderGraph();
	}
}

export function addProcessingPlaceholder(data) {
	if (!graphData || !simulation) return { id: null };
	const nodeId = `processing-${generateId()}`;
	const width = graphContainer.value?.clientWidth || 800;
	const height = graphContainer.value?.clientHeight || 600;
	const node = {
		id: nodeId,
		title: (data.metadata?.title || data.url || 'New website').substring(0, 25),
		size: 18,
		baseSize: 18,
		type: 'processing',
		x: width / 2 + (Math.random() - 0.5) * 300,
		y: height / 2 + (Math.random() - 0.5) * 300,
		vx: 0,
		vy: 0,
	};
	graphData.nodes.push(node);
	simulation.nodes(graphData.nodes);
	simulation.alpha(0.3).restart();
	renderGraph();
	return node;
}

export function removeProcessingPlaceholder(nodeId) {
	if (!nodeId || !graphData) return;
	graphData.nodes = graphData.nodes.filter(n => n.id !== nodeId);
	if (simulation) simulation.nodes(graphData.nodes);
	renderGraph();
}

export function updateConnections() {
	if (rawClusters.length > 0) {
		// eslint-disable-next-line no-undef
		filterGraphByAlbum();
	}
}

// ==============================================
// NODE EXPLOSION / COLLAPSE
// ==============================================
export function explodeNode(clusterNode) {
	trackEvent('cluster_exploded', {
		website_count: clusterNode.websites.length
	});
	if (explodedNode.value && explodedNode.value.id !== clusterNode.id) {
		collapseNode();
		setTimeout(() => {
			performExplosion(clusterNode);
		}, 100);
	} else if (explodedNode.value && explodedNode.value.id === clusterNode.id) {
		collapseNode();
	} else {
		performExplosion(clusterNode);
	}
}

export function performExplosion(clusterNode) {
	explodedNode.value = clusterNode;
	const centerX = clusterNode.x;
	const centerY = clusterNode.y;

	// Lock cluster position ONLY
	clusterNode.fx = centerX;
	clusterNode.fy = centerY;

	const radius = 80;
	websiteNodes = [];
	const totalNodes = clusterNode.websites.length + 1;
	const angleStep = (2 * Math.PI) / totalNodes;

	clusterNode.websites.forEach((website, index) => {
		const angle = angleStep * index;
		const websiteNode = {
			id: `website-${website.id}`,
			websiteId: website.id,
			title: website.title,
			url: website.url,
			domain: website.domain,
			processed_at: website.processed_at,
			is_file: !!website.is_file,
			file_id: website.file_id || null,
			is_note: !!website.is_note,
			note_text: website.note_text || null,
			added_by: website.added_by || null,
			size: 10,
			baseSize: 10,
			type: "website",
			parentCluster: clusterNode.id,
			x: centerX, // Start at center
			y: centerY,
			vx: 0, // ADD: reset velocity
			vy: 0, // ADD: reset velocity
			fx: centerX + Math.cos(angle) * radius,
			fy: centerY + Math.sin(angle) * radius,
		};
		websiteNodes.push(websiteNode);
		graphData.nodes.push(websiteNode);

		graphData.links.push({
			source: clusterNode.id,
			target: websiteNode.id,
			type: "website-link",
		});
	});

	const discoverAngle = angleStep * clusterNode.websites.length;
	const discoverNode = {
		id: `discover-${clusterNode.id}`,
		title: "Discover Similar",
		size: 14,
		baseSize: 14,
		type: "discover",
		parentCluster: clusterNode.id,
		x: centerX,
		y: centerY,
		vx: 0, // ADD: reset velocity
		vy: 0, // ADD: reset velocity
		fx: centerX + Math.cos(discoverAngle) * radius,
		fy: centerY + Math.sin(discoverAngle) * radius,
	};
	websiteNodes.push(discoverNode);
	graphData.nodes.push(discoverNode);

	graphData.links.push({
		source: clusterNode.id,
		target: discoverNode.id,
		type: "discover-link",
	});

	simulation.nodes(graphData.nodes);
	simulation.force("link").links(graphData.links);
	simulation.alpha(0.3).restart();

	renderGraph();

	// Release positions after animation
	setTimeout(() => {
		websiteNodes.forEach((node) => {
			const d3Node = graphData.nodes.find((n) => n.id === node.id);
			if (d3Node) {
				d3Node.fx = null;
				d3Node.fy = null;
			}
		});
		clusterNode.fx = null;
		clusterNode.fy = null;
	}, 500);
}

export function collapseNode() {
	if (!explodedNode.value) return;

	const centerX = explodedNode.value.x;
	const centerY = explodedNode.value.y;

	// Immediately remove nodes and links (no animation needed for switch)
	graphData.nodes = graphData.nodes.filter(
		(node) => node.type !== "website" && node.type !== "discover"
	);

	graphData.links = graphData.links.filter(
		(link) => link.type !== "website-link" && link.type !== "discover-link"
	);

	// Release the exploded cluster's fixed position
	if (explodedNode.value) {
		explodedNode.value.fx = null;
		explodedNode.value.fy = null;
	}

	websiteNodes = [];
	explodedNode.value = null;
	selectedWebsite.value = null;

	// Update simulation
	simulation.nodes(graphData.nodes);
	simulation.force("link").links(graphData.links);

	renderGraph();
}

// ==============================================
// STICKY NOTE DRAGGING
// ==============================================
export function startDraggingSticky(e) {
	isDraggingSticky = true;
	const stickyEl = e.currentTarget.parentElement;
	const rect = stickyEl.getBoundingClientRect();
	dragOffsetX = e.clientX - rect.left;
	dragOffsetY = e.clientY - rect.top;
	document.addEventListener("mousemove", handleStickyDrag);
	document.addEventListener("mouseup", stopStickyDrag);
}

export function handleStickyDrag(e) {
	if (!isDraggingSticky) return;
	stickyNoteStyle.value = {
		left: e.clientX - dragOffsetX + "px",
		top: e.clientY - dragOffsetY + "px",
	};
}

export function stopStickyDrag() {
	isDraggingSticky = false;
	document.removeEventListener("mousemove", handleStickyDrag);
	document.removeEventListener("mouseup", stopStickyDrag);
}

// ==============================================
// D3 RENDERING
// ==============================================
// sharedGraphId is optional - passed by GraphNode.vue when mounted at
// /shared/:graphId. Dynamic import (rather than a static one) avoids turning
// the existing useGraphEngine <-> useAlbums-style circular-import convention
// into a three-way cycle for this one, optional, rarely-taken path.
export async function initializeGraph(sharedGraphId = null) {
	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;

	if (sharedGraphId) {
		const { openSharedGraph } = await import("./useSharing");
		await openSharedGraph(sharedGraphId);
	} else {
		await loadData();
	}

	svg = d3
		.select(graphContainer.value)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.style("overflow", "visible");

	container = svg.append("g");

	zoom = d3
		.zoom()
		.scaleExtent([0.2, 3])
		.on("zoom", (event) => {
			container.attr("transform", event.transform);
		});

	svg.call(zoom);

	simulation = d3
		.forceSimulation(graphData.nodes)
		.force(
			"link",
			d3
				.forceLink(graphData.links)
				.id((d) => d.id)
				.distance((d) => (d.type === "website-link" ? 80 : 200))
				.strength(0.03)
		)
		.force("charge", d3.forceManyBody().strength(-200))
		.force("center", d3.forceCenter(width / 2, height / 2))
		.force(
			"collision",
			d3.forceCollide().radius((d) => d.size * settings.nodeSize + 15)
		)
		.force("x", d3.forceX(width / 2).strength(0.02))
		.force("y", d3.forceY(height / 2).strength(0.02));

	renderGraph();

	setTimeout(() => {
		centerView();
	}, 1000);
}

// Node-anchored live-cursor badges for a shared graph: a small dot per
// identity currently "looking at" a node, keyed the same way renderGraph()
// keys node <g> elements (d.id) - see plan doc on why cursors are
// node-anchored rather than coordinate-anchored (D3 force simulations are
// non-deterministic per client, so a raw position means nothing on a
// collaborator's independently-laid-out copy of the same graph). Called from
// useSharing.js's watch(remoteCursors, ...), not from renderGraph() itself,
// since it only ever needs to run when the cursor map changes, not on every
// tick.
export function renderRemoteCursors(cursorsByIdentity) {
	if (!container) return;
	const nodeGroup = container.select(".nodes");
	if (nodeGroup.empty()) return;

	const cursorsByNode = {};
	Object.entries(cursorsByIdentity || {}).forEach(([identityKey, nodeId]) => {
		if (!nodeId) return;
		(cursorsByNode[nodeId] ||= []).push(identityKey);
	});

	nodeGroup.selectAll(".node").each(function (d) {
		const g = d3.select(this);
		const identities = cursorsByNode[d.id] || [];
		const radius = d.size * settings.nodeSize;

		g.selectAll(".node-cursor-badge")
			.data(identities, (identityKey) => identityKey)
			.join(
				(enter) => enter.append("circle").attr("class", "node-cursor-badge").attr("r", 5).attr("stroke", "#fff").attr("stroke-width", 1.5),
				(update) => update,
				(exit) => exit.remove()
			)
			.attr("cy", -(radius + 10))
			.attr("cx", (_, i) => radius + 10 + i * 14)
			.attr("fill", currentTheme.value.colors.secondary);
	});
}

export function centerView() {
	if (!svg || !container || !graphContainer.value) return;

	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;
	const bounds = container.node().getBBox();

	if (bounds.width > 0 && bounds.height > 0) {
		const fullWidth = bounds.width;
		const fullHeight = bounds.height;
		const midX = bounds.x + fullWidth / 2;
		const midY = bounds.y + fullHeight / 2;

		const scale = Math.min(width / fullWidth, height / fullHeight) * 0.7;
		const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

		svg
			.transition()
			.duration(1500)
			.call(
				zoom.transform,
				d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
			);
	}
}

export function renderGraph() {
	container.selectAll(".links").data([null]).join("g").attr("class", "links");
	container.selectAll(".nodes").data([null]).join("g").attr("class", "nodes");
	container.selectAll(".labels").data([null]).join("g").attr("class", "labels");

	const linkGroup = container.select(".links");
	const nodeGroup = container.select(".nodes");
	const labelGroup = container.select(".labels");

	const links = linkGroup
		.selectAll(".link")
		.data(
			graphData.links,
			(d) => `${d.source.id || d.source}-${d.target.id || d.target}`
		)
		.join("line")
		.attr("class", (d) => `link ${d.type}`)
		.style("opacity", (d) => {
			if (d.type === "website-link" || d.type === "discover-link") return 0.6;
			if (d.type === "notes-hub-link") return showConnections.value ? 0.5 : 0;
			return showConnections.value ? 0.4 : 0;
		})
		.style("stroke-width", (d) => {
			if (d.type === "website-link" || d.type === "discover-link") return 1.5;
			if (d.type === "notes-hub-link") return 1.5;
			return Math.max(1, (d.similarity || 0.5) * 4);
		})
		.style("stroke", (d) => {
			if (d.type === "discover-link") return "#95a5a6";
			if (d.type === "website-link") return "#adb5bd";
			if (d.type === "notes-hub-link") return currentTheme.value.colors.secondary;
			return "#adb5bd";
		})
		.style("stroke-dasharray", (d) => (d.type === "notes-hub-link" ? "5 4" : null));

	// Each node is a <g> (not a bare <circle>) so a subset - uploaded-file
	// website nodes - can carry a second child element (the file glyph) on
	// top of the exact same circle every other node gets. The circle's own
	// r/fill/stroke logic is unchanged; only the wrapper changed, so "same
	// size and same color" for file nodes falls out for free.
	// Attribution badges only matter once there's more than one possible
	// contributor - a plain local album's added_by is always just the
	// viewer themself, so the badge would be pure clutter there. Covers both
	// a collaborator/guest on /shared/:graphId (remoteGraphId) and the
	// owner's own /dashboard with an actively-shared album selected
	// (activeShareGraphId) - both refs are declared in this same file
	// specifically so code here can read them directly with no import.
	const isSharedContext = !!(remoteGraphId.value || activeShareGraphId.value);

	const nodes = nodeGroup
		.selectAll(".node")
		.data(graphData.nodes, (d) => d.id)
		.join(
			(enter) => {
				const g = enter.append("g").attr("class", (d) => `node ${d.type}`);
				g.append("circle").attr("class", "node-circle");
				g.filter((d) => d.type === "website" && d.is_file)
					.append("path")
					.attr("class", "node-file-icon")
					.attr("d", FILE_ICON_PATH)
					.attr("pointer-events", "none");
				g.filter((d) => d.type === "website" && d.is_note)
					.append("path")
					.attr("class", "node-note-icon")
					.attr("d", NOTE_ICON_PATH)
					.attr("pointer-events", "none");
				// "Who added this" - a persistent satellite dot, opposite corner
				// from .node-cursor-badge (renderRemoteCursors()) so the two never
				// collide: this one is static per-node data, that one is a live,
				// ephemeral presence ping.
				if (isSharedContext) {
					g.filter((d) => d.type === "website" && d.added_by)
						.append("circle")
						.attr("class", "node-attribution-badge")
						.attr("r", 5)
						.attr("stroke", "#fff")
						.attr("stroke-width", 1.5)
						.attr("pointer-events", "none");
				}
				return g;
			},
			(update) => update,
			(exit) => exit.remove()
		)
		.attr("data-id", (d) => d.id)
		.call(drag(simulation));

	nodes
		.select(".node-circle")
		.attr("r", (d) => d.size * settings.nodeSize)
		.attr("fill", (d) => {
			if (d.type === "discover") return currentTheme.value.colors.primary;
			if (d.type === "processing") return currentTheme.value.colors.secondary;
			if (d.type === "website") return currentTheme.value.colors.node;
			return currentTheme.value.colors.node;
		})
		.attr("stroke", (d) => {
			if (d.type === "discover") return currentTheme.value.colors.secondary;
			if (d.type === "processing") return currentTheme.value.colors.nodeStroke;
			if (d.type === "website") return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
		})
		.attr("stroke-width", 2)
		.attr("stroke-dasharray", (d) => (d.type === "cluster" && d.is_notes_cluster ? "4 3" : null));

	nodes
		.select(".node-file-icon")
		.attr("transform", () => `scale(${settings.nodeSize})`)
		.attr("fill", currentTheme.value.colors.background)
		.attr("stroke", currentTheme.value.colors.nodeStroke)
		.attr("stroke-width", 0.8)
		.attr("stroke-linejoin", "round");

	nodes
		.select(".node-note-icon")
		.attr("transform", () => `scale(${settings.nodeSize})`)
		.attr("fill", currentTheme.value.colors.background)
		.attr("stroke", currentTheme.value.colors.nodeStroke)
		.attr("stroke-width", 0.8)
		.attr("stroke-linejoin", "round");

	nodes
		.select(".node-attribution-badge")
		.attr("cy", (d) => d.size * settings.nodeSize + 8)
		.attr("cx", (d) => -(d.size * settings.nodeSize + 8))
		.attr("fill", (d) => colorForIdentity(d.added_by));

	const labels = labelGroup
		.selectAll(".node-label")
		.data(graphData.nodes, (d) => d.id)
		.join("text")
		.attr("class", "node-label")
		.text((d) => {
			if (d.type === "processing") return "Processing...";
			if (d.type === "website")
				return d.title.substring(0, 20) + (d.title.length > 20 ? "..." : "");
			if (d.type === "discover") return "";
			return d.topic;
		})
		.style("font-size", (d) => {
			if (d.type === "website") return "8px";
			if (d.type === "processing") return "9px";
			if (d.type === "discover") return "18px";
			return Math.max(10, (d.size * settings.nodeSize) / 3.5) + "px";
		})
		.style("fill", (d) => {
			if (d.type === "discover") return "#ffffff";
			return currentTheme.value.colors.text;
		})
		.style("font-weight", (d) => (d.type === "discover" ? "400" : "500"))
		.style('text-anchor', 'middle');

	nodes
		.on("mouseover", handleNodeMouseOver)
		.on("mouseout", handleNodeMouseOut)
		.on("click", handleNodeClick)
		.on('contextmenu', handleNodeRightClick);

	simulation.on("tick", () => {
		links
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);

		labels
			.attr('x', d => d.x)
			.attr('y', d => {
				// All node types should have text below
				return d.y + (d.size * settings.nodeSize) + 18;
			});
	});
}

export function drag(simulation) {
	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	return d3
		.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
}

// ==============================================
// EVENT HANDLERS
// ==============================================
export function handleNodeMouseOver(event, d) {
	const tooltipEl = d3.select(tooltip.value);
	tooltipEl
		.transition()
		.duration(200 / settings.animationSpeed)
		.style("opacity", 1);

	let tooltipContent = "";
	if (d.type === "cluster") {
		tooltipContent = `<strong>${d.topic}</strong><br>Websites: ${d.website_count}<br>Click to explode`;
	} else if (d.type === "website") {
		tooltipContent = `<strong>${d.title}</strong><br>${d.domain}<br>Click for details`;
	} else if (d.type === "discover") {
		tooltipContent = `<strong>Discover Similar</strong><br>Find related websites`;
	} else if (d.type === "processing") {
		tooltipContent = `<strong>Processing…</strong><br>${d.title}`;
	}

	// "Added by X" - appended asynchronously once resolved (same dynamic-
	// import pattern as sendCursorUpdate below, to avoid the circular-import
	// hazard this project has hit before). Skipped for older content with no
	// added_by, and resolves to nothing for a guest viewer (never reveals
	// identities to guests - see resolveAddedByName()'s own comment).
	if (d.type === "website" && d.added_by) {
		import("./useSharing").then(({ resolveAddedByName }) => {
			const name = resolveAddedByName(d.added_by);
			if (name) tooltipEl.html(tooltipEl.html() + `<br>Added by ${name}`);
		});
	}

	tooltipEl
		.html(tooltipContent)
		.style("left", event.pageX + 15 + "px")
		.style("top", event.pageY - 10 + "px");

	if (d.type === "cluster") {
		highlightConnections(d);
	}

	// Node-anchored live cursor ping - dynamic import (not a static one)
	// deliberately, matching the same safe pattern initializeGraph() already
	// uses below: useSharing.js statically imports from this file, so a
	// static import back would create the same circular-eval-order hazard
	// that caused a real, app-breaking crash earlier in this project (see
	// initLocalOwnerSync()'s comment in useSharing.js for the full story).
	// sendCursorUpdate() itself already no-ops with no open socket and is
	// internally throttled, so firing this on every hover is safe.
	import("./useSharing").then(({ sendCursorUpdate }) => sendCursorUpdate(d.id));
}

export function handleNodeMouseOut() {
	d3.select(tooltip.value)
		.transition()
		.duration(200 / settings.animationSpeed)
		.style("opacity", 0);
	clearHighlights();

	// Clears this viewer's presence dot on every other collaborator's
	// screen - previously nothing ever did, so a dot stuck around on
	// whatever node was last hovered until someone happened to hover a
	// different one. Same dynamic-import pattern as handleNodeMouseOver.
	import("./useSharing").then(({ sendCursorUpdate }) => sendCursorUpdate(null));
}

export async function handleNodeClick(event, d) {
	event.stopPropagation();
	showAddNotePrompt.value = false;
	showAddTypeMenu.value = false;

	if (d.type === 'processing') return;

	if (d.type === "cluster") {
		explodeNode(d);
	} else if (d.type === "website") {
		await showWebsiteDetails(event, d);
	} else if (d.type === "discover") {
		await handleDiscoverClick();
	}
}

export async function showWebsiteDetails(event, websiteNode) {
	selectedWebsite.value = websiteNode;
	websiteDetails.value = null;
	console.log("Showing details for website:", websiteNode);

	const containerRect = graphContainer.value.getBoundingClientRect();
	const nodeScreenX = event.pageX - containerRect.left;
	const nodeScreenY = event.pageY - containerRect.top;

	const stickyWidth = 300;
	const stickyHeight = 280;

	let left = nodeScreenX + 20;
	let top = nodeScreenY - stickyHeight / 2;

	if (left + stickyWidth > containerRect.width) {
		left = nodeScreenX - stickyWidth - 20;
	}
	if (top < 20) top = 20;
	if (top + stickyHeight > containerRect.height - 20) {
		top = containerRect.height - stickyHeight - 20;
	}

	stickyNoteStyle.value = {
		left: left + "px",
		top: top + "px",
	};

	try {
		const result = await fetchWebsiteDetails(websiteNode.websiteId);

		if (result && result.website) {
			websiteDetails.value = result.website;
		}
	} catch (error) {
		console.error("Error loading website details:", error);
	}
}

export function handleBackgroundClick() {
	selectedWebsite.value = null;
	showAlbumsDropdown.value = false;
	closeContextMenu();
	showWebsiteContextMenu.value = false;
	showAddTypeMenu.value = false;
}

export function closeStickyNote() {
	selectedWebsite.value = null;
	websiteDetails.value = null;
}

export function handleNodeRightClick(event, d) {
	event.preventDefault();
	event.stopPropagation();

	// No context menu at all in a read-only shared view - every item in both
	// menus (Add to Album, Delete Cluster, Edit Title, etc.) is a mutation,
	// and a guest/view-only collaborator shouldn't be offered any of them.
	if (isReadOnlySharedView.value) return;

	if (d.type === 'cluster') {
		contextCluster.value = clusters.value[d.id];
		contextMenuStyle.value = { left: event.pageX + 'px', top: event.pageY + 'px' };
		showContextMenu.value = true;
		showWebsiteContextMenu.value = false;
	} else if (d.type === 'website') {
		websiteContextNode.value = d;
		contextMenuStyle.value = { left: event.pageX + 'px', top: event.pageY + 'px' };
		showWebsiteContextMenu.value = true;
		showContextMenu.value = false;
	}
}

export function closeContextMenu() {
	showContextMenu.value = false;
	contextCluster.value = null;
}

export function highlightConnections(node) {
	const connectedNodeIds = new Set();
	const connectedLinks = new Set();

	graphData.links.forEach((link) => {
		const sourceId = link.source.id || link.source;
		const targetId = link.target.id || link.target;

		if (sourceId === node.id && link.type === "cluster-link") {
			connectedNodeIds.add(targetId);
			connectedLinks.add(link);
		} else if (targetId === node.id && link.type === "cluster-link") {
			connectedNodeIds.add(sourceId);
			connectedLinks.add(link);
		}
	});

	// Highlight connected nodes. Opacity dims the whole node (circle + file
	// icon together); stroke/stroke-width target the circle specifically -
	// it carries its own explicit stroke attrs, which would otherwise shadow
	// anything set on the parent <g>.
	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? 1 : 0.4
		);

	container.select('.nodes')
		.selectAll('.node-circle')
		.attr("stroke", d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? currentTheme.value.colors.primary : null
		)
		.attr('stroke-width', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? 3 : 2
		);

	// Highlight connected links
	container.select('.links')
		.selectAll('.link')
		.style('opacity', d => connectedLinks.has(d) ? 0.8 : 0.2)
		.style('stroke', d => connectedLinks.has(d) ? '#4A90E2' : null)
		.style('stroke-width', d => connectedLinks.has(d) ? 3 : null);
}

export function clearHighlights() {
	if (!container) return;

	// Don't clear search highlights if there's an active search
	if (!searchTerm()) {
		container.select('.nodes')
			.selectAll('.node')
			.style('opacity', 1);

		container.select('.nodes')
			.selectAll('.node-circle')
			.attr('stroke-width', 2);

		container.select('.labels')
			.selectAll('.node-label')
			.style('opacity', 1)
			.style('font-weight', '500');
	} else {
		// Restore search highlight state
		const term = searchTerm().toLowerCase();
		container.select('.nodes')
			.selectAll('.node')
			.style('opacity', d => {
				const matches = d.type === 'cluster'
					? d.topic?.toLowerCase().includes(term)
					: d.title?.toLowerCase().includes(term);
				return matches ? 1 : 0.3;
			});
	}

	// Always clear connection highlights
	container.select('.nodes')
		.selectAll('.node-circle')
		.attr("stroke", d => {
			if (d.type === 'discover') return currentTheme.value.colors.secondary;
			if (d.type === 'website') return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
		})
		.attr('stroke-width', 2);

	container.select('.links')
		.selectAll('.link')
		.style('opacity', d => {
			if (d.type === 'website-link' || d.type === 'discover-link') return 0.6;
			return showConnections.value ? 0.4 : 0;
		})
		.style("stroke", d => {
			if (d.type === 'discover-link') return currentTheme.value.colors.nodeStroke;
			if (d.type === 'website-link') return currentTheme.value.colors.nodeStroke;
			return currentTheme.value.colors.nodeStroke;
		})
		.style('stroke-width', d => {
			if (d.type === 'website-link' || d.type === 'discover-link') return 1.5;
			return Math.max(1, (d.similarity || 0.5) * 4);
		});
}

// ==============================================
// VIEW / SETTINGS
// ==============================================
export function updateNodeSizes() {
	container
		.select(".nodes")
		.selectAll(".node-circle")
		.transition()
		.duration(300 / settings.animationSpeed)
		.attr("r", (d) => d.baseSize * settings.nodeSize);

	container
		.select(".nodes")
		.selectAll(".node-file-icon")
		.transition()
		.duration(300 / settings.animationSpeed)
		.attr("transform", () => `scale(${settings.nodeSize})`);

	container
		.select(".nodes")
		.selectAll(".node-note-icon")
		.transition()
		.duration(300 / settings.animationSpeed)
		.attr("transform", () => `scale(${settings.nodeSize})`);

	container
		.select(".labels")
		.selectAll(".node-label")
		.transition()
		.duration(300 / settings.animationSpeed)
		.style("font-size", (d) => {
			if (d.type === "website") return "8px";
			if (d.type === "discover") return "18px";
			return Math.max(10, (d.baseSize * settings.nodeSize) / 3.5) + "px";
		});

	if (simulation) {
		simulation.force(
			"collision",
			d3.forceCollide().radius((d) => d.baseSize * settings.nodeSize + 15)
		);
		simulation.alpha(0.3).restart();
	}
}

export function resetView() {
	centerView();
}

export function toggleConnections() {
	container
		.select(".links")
		.selectAll(".link.cluster-link")
		.transition()
		.duration(500 / settings.animationSpeed)
		.style("opacity", showConnections.value ? 0.4 : 0);
}

export function handleResize() {
	if (svg && graphContainer.value) {
		const width = graphContainer.value.clientWidth;
		const height = graphContainer.value.clientHeight;
		svg.attr("width", width).attr("height", height);
		selectedWebsite.value = null;
	}
}
