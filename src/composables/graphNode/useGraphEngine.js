import { ref, reactive } from "vue";
import * as d3 from "d3";
import { db } from "./useDatabase";
import { currentTheme } from "./useThemes";
import { searchTerm } from "./useSearch";
import { handleDiscoverClick } from "./useDiscover";
import { fetchAlbums, showAlbumsDropdown } from "./useAlbums";
import { useAnalytics } from "../useAnalytics";
import {
	generateId,
	cosineSimilarity,
	averageEmbeddings,
	normalizeTopicTerm,
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
export const dropdownMode = ref(storedDropdownMode === "history" ? "history" : "albums");
export const currentHistoryDay = ref(null);

export function setDropdownMode(mode) {
	if (mode !== "albums" && mode !== "history") return;
	if (dropdownMode.value === mode) return;

	dropdownMode.value = mode;
	localStorage.setItem(DROPDOWN_MODE_KEY, mode);
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
								processed_at: website.processed_at
							}));

						return {
							cluster_id: cluster.id,
							topic: cluster.topic,
							website_count: websitesList.length,
							websites: websitesList,
							similar_links: cluster.similar_links || {}
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
	const normalizedTopic = normalizeTopicTerm(topic);

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

	console.log("✅ Processed data:", {
		nodeCount: nodes.length,

		linkCount: links.length,
	});

	return { nodes, links };
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
export async function initializeGraph() {
	const width = graphContainer.value.clientWidth;
	const height = graphContainer.value.clientHeight;

	await loadData();

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
			return showConnections.value ? 0.4 : 0;
		})
		.style("stroke-width", (d) => {
			if (d.type === "website-link" || d.type === "discover-link") return 1.5;
			return Math.max(1, (d.similarity || 0.5) * 4);
		})
		.style("stroke", (d) => {
			if (d.type === "discover-link") return "#95a5a6";
			if (d.type === "website-link") return "#adb5bd";
			return "#adb5bd";
		});

	const nodes = nodeGroup
		.selectAll(".node")
		.data(graphData.nodes, (d) => d.id)
		.join("circle")
		.attr("class", (d) => `node ${d.type}`)
		.attr("data-id", (d) => d.id)
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
		.call(drag(simulation));

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

		nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

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

	tooltipEl
		.html(tooltipContent)
		.style("left", event.pageX + 15 + "px")
		.style("top", event.pageY - 10 + "px");

	if (d.type === "cluster") {
		highlightConnections(d);
	}
}

export function handleNodeMouseOut() {
	d3.select(tooltip.value)
		.transition()
		.duration(200 / settings.animationSpeed)
		.style("opacity", 0);
	clearHighlights();
}

export async function handleNodeClick(event, d) {
	event.stopPropagation();

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
}

export function closeStickyNote() {
	selectedWebsite.value = null;
	websiteDetails.value = null;
}

export function handleNodeRightClick(event, d) {
	event.preventDefault();
	event.stopPropagation();

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

	// Highlight connected nodes
	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', d =>
			d.id === node.id || connectedNodeIds.has(d.id) ? 1 : 0.4
		)
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
			.style('opacity', 1)
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
		.selectAll('.node')
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
		.selectAll(".node")
		.transition()
		.duration(300 / settings.animationSpeed)
		.attr("r", (d) => d.baseSize * settings.nodeSize);

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
