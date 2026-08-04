import { ref, computed } from "vue";
import { pipeline, env } from "@xenova/transformers";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { useAnalytics } from "../useAnalytics";
import { rocusAlert, rocusConfirm } from "../useRocusDialog";
import { promptConsent } from "./useAnalyticsBanner";
import { albums } from "./useAlbums";
import {
	websites,
	embeddings,
	addProcessingPlaceholder,
	removeProcessingPlaceholder,
	assignToCluster,
	assignNoteToCluster,
	saveToIndexedDB,
	refreshData,
	clusters,
	effectiveAlbumId,
	remoteGraphId,
	activeShareGraphId,
} from "./useGraphEngine";
import { addSimilarLinksToCluster } from "./useDiscover";
import { generateId, wrapEmbedding, EMBEDDING_MODEL_ID, cleanAiLabel, toTitleCase, currentIdentityKey } from "./utils";
import { openPremiumModal } from "./usePremium";
import { runCompatibilityCheckIfNeeded } from "./useCompatibilityCheck";
import { pushNodeUpdateForAlbum, quickAddRoutesHere, showQuickAddRoutingPrompt, maybeShowQuickAddRoutingPrompt } from "./useSharing";
import { API_BASE } from "../../components/constants/config";

// configuring transformers.js (embeddings)
env.allowLocalModels = false;
env.useBrowserCache = true;

const { trackEvent } = useAnalytics();

const MODEL_CDN_BASE = 'https://models.rocus.io';

export const availableModels = ref([
	{
		id: 'Qwen2.5-0.5B-Rocus',
		name: 'Fast (0.5B)',
		description: 'Runs on all devices, basic summaries',
		size: '~350MB',
		speed: 'Very Fast',
		quality: 'Basic',
		url: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC`, // base URL
		wasm: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/Qwen2-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
		config: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/mlc-chat-config.json`
	},
]);

export const selectedModel = ref('Qwen2.5-0.5B-Rocus');
export const engine = ref(null);

const HAIKU_SUMMARIZE_URL = import.meta.env.VITE_ROCUS_SUM;
const PROCESSING_MODE_KEY = 'rocus-processing-mode';

// 'local' (on-device WebLLM) or 'commercial' (Claude Haiku, proxied through
// rocus-search-api). Read synchronously at module init - before loadModels()
// ever runs from GraphNode.vue's onMounted - so commercial mode never
// triggers the ~350MB local WebLLM download.
//
// New users (key never set) default into commercial mode - everyone gets a
// rationed daily taste of cloud processing before hitting a paywall, gated
// server-side by quota rather than by mode. Any existing stored value is
// respected as-is, whether it got there via an explicit user choice or via
// the (now-removed) auto-downgrade watcher that used to force non-premium
// users back to local - both wrote through this same localStorage key, so
// there's no way to tell those two cases apart after the fact.
const storedProcessingMode = localStorage.getItem(PROCESSING_MODE_KEY);
export const processingMode = ref(
	storedProcessingMode === null ? 'commercial' : (storedProcessingMode === 'commercial' ? 'commercial' : 'local')
);

export function setProcessingMode(mode) {
	if (mode !== 'local' && mode !== 'commercial') return;
	const switchingToLocal = mode === 'local' && processingMode.value !== 'local';
	processingMode.value = mode;
	localStorage.setItem(PROCESSING_MODE_KEY, mode);

	if (switchingToLocal && !summarizationModel) {
		enterLocalModeGuided();
	}
}

// Walks the user through switching to local mode step by step instead of
// firing the compatibility check and the ~350MB model download at once with
// no relationship between them: check compatibility first and wait for the
// user to actually acknowledge the result (not just for the check to finish
// running - runCompatibilityCheckIfNeeded's promise now resolves on
// dismissal), then automatically open the Model Status panel so download
// progress is visible without the user needing to notice and click the
// header icon themselves, then start the download.
async function enterLocalModeGuided() {
	try {
		await runCompatibilityCheckIfNeeded();
	} catch (err) {
		console.error("Compatibility check failed:", err);
	}

	showModelStatus.value = true;
	try {
		await ensureSummarizationModel();
	} catch (err) {
		console.error("On-demand local model load failed:", err);
	}
}
export const modelLoading = ref(false);
export const loadingMessage = ref("");
export const downloadProgress = ref(0);
export const error = ref("");
export const showModelStatus = ref(false);

export function toggleModelStatus() {
	showModelStatus.value = !showModelStatus.value;
}

export function closeModelStatus() {
	showModelStatus.value = false;
}

// Plain (non-ref) module bindings, exactly like the original component's
// `let embeddingModel = null` / `let summarizationModel = null`. The
// component template reads these directly as top-level bindings (their
// "Loaded"/"Not Loaded" badges just happen to re-render whenever some other
// reactive value in the same render, e.g. modelLoading, changes) - exporting
// them preserves that exact behavior across the module boundary.
export let embeddingModel = null; // transformers.js embedding model (MiniLM)
export let summarizationModel = null; // will point to the Web-LLM engine (chat-style)

// In-flight load promises, so processWebsite can wait for a model that's
// already loading instead of failing outright. Concretely: a quick-add into
// a freshly-created hidden background tab (extension flow) sees the page's
// document finish loading almost immediately, but this Vue app still needs
// a few seconds after that to actually fetch+init the embedding model -
// without this, that guard below would fire before the model was ever given
// a chance to finish, silently dropping the save.
let embeddingReadyPromise = null;
let summarizationReadyPromise = null;

async function waitFor(promiseGetter, isReady, timeoutMs = 40000) {
	if (isReady()) return true;
	const promise = promiseGetter();
	if (!promise) return false; // never started loading - nothing to wait for
	try {
		await Promise.race([
			promise,
			new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
		]);
	} catch {
		// timed out, or the load itself failed - fall through to the isReady()
		// check below either way
	}
	return isReady();
}

export const processingQueue = ref([]);
export const processedCount = ref(0);
export const isProcessing = ref(false);
export const showNewDataNotification = ref(false);

export const queueProgress = computed(() => {
	if (processingQueue.value.length === 0) return 0;
	return (processedCount.value / processingQueue.value.length) * 100;
});

// Cosine similarity-based embedding generation (Transformers.js)
export async function generateEmbedding(text) {
	if (!embeddingModel) return null;

	try {
		const result = await embeddingModel(text, {
			pooling: "mean",
			normalize: true,
		});
		// result.data is a TypedArray/ArrayBuffer-like; convert to regular array
		return Array.from(result.data);
	} catch (err) {
		console.error("Error generating embedding:", err);
		return null;
	}
}

export async function generateSummaryAndTopic(metadata, content) {
	// If summarizationModel isn't ready, return fallback
	if (!summarizationModel) return { summary: "", topic: "", query: "" };

	try {
		const contentChunk = content.substring(0, 2500);

		// STEP 1: Generate summary first (needed for topic and query)
		const summaryResult = await summarizationModel.chat.completions.create({
			messages: [{
				role: "user",
				content: `Create a detailed 2-3 sentence summary from this webpage content:

TITLE: ${metadata.title}
DESCRIPTION: ${metadata.description || ""}
CONTENT: ${contentChunk}

Write a summary that describes what this page is about, what it offers, and key details. Make it good for semantic search:

Summary:`
			}],
			max_tokens: 120,
			temperature: 0.3,
		});

		const summary = summaryResult.choices?.[0]?.message?.content?.trim() ?? "";
		console.log("Summary generated:", summary);

		// STEP 2 & 3: Generate topic and query in parallel (now that summary exists)
		const [topicResult, queryResult] = await Promise.all([
			summarizationModel.chat.completions.create({
				messages: [{
					role: "user",
					content: `Name the underlying subject or category this page is about, using ONLY one or two words like a noun phrase. Do not just repeat or rephrase words from the title - identify what it's actually about.

TITLE: ${metadata.title}
SUMMARY: ${summary}

Main topic:`
				}],
				max_tokens: 10,
				temperature: 0.2,
			}),

			summarizationModel.chat.completions.create({
				messages: [{
					role: "user",
					content: `Create a Google search query to find this page:

TITLE: ${metadata.title}
DOMAIN: ${metadata.domain}
SUMMARY: ${summary}

Search query:`
				}],
				max_tokens: 20,
				temperature: 0.2,
			})
		]);

		console.log("Topic and query processing complete");

		// Extract results
		const topic = cleanAiLabel(topicResult.choices?.[0]?.message?.content ?? "");
		const query = queryResult.choices?.[0]?.message?.content?.trim() ?? "";

		console.log("Final results:", { summary, topic, query });

		// Validate and return with fallbacks
		return {
			summary: summary || metadata.description || contentChunk.substring(0, 200),
			topic: topic || extractTopic(metadata.title, metadata.keywords) || "General",
			query: query || `${metadata.title} ${metadata.domain}`.trim()
		};

	} catch (err) {
		console.error("Error in chained summarization:", err);

		// Fallback to extractive summary
		return {
			summary: extractFallbackSummary(content, metadata),
			topic: extractTopic(metadata.title, metadata.keywords) || "General",
			query: `${metadata.title || ""} ${metadata.domain || ""}`.trim()
		};
	}
}

// Thrown specifically when the backend's freemium daily quota is exhausted
// (distinguishable from the pre-existing IP-based rate limiter, which is a
// generic 429 with no `code` field) - callers should not retry or silently
// fall back on this one, unlike a transient network/server error.
export class QuotaExceededError extends Error {
	constructor(message, details) {
		super(message);
		this.name = 'QuotaExceededError';
		this.details = details;
	}
}

async function callHaikuSummarizeOnce(metadata, contentChunk) {
	const response = await fetch(HAIKU_SUMMARIZE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			title: metadata.title || '',
			description: metadata.description || '',
			domain: metadata.domain || '',
			content: contentChunk,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		if (errorData.code === 'COMMERCIAL_QUOTA_EXCEEDED') {
			throw new QuotaExceededError(errorData.message || 'Commercial quota exceeded', errorData);
		}
		if (response.status === 429) {
			throw new Error('Rate limit exceeded. Please try again in 15 minutes.');
		}
		throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
	}

	const data = await response.json();
	if (!data.success || !data.summary) {
		throw new Error('Invalid response from summarize API');
	}
	return data;
}

// Commercial-mode equivalent of generateSummaryAndTopic: one consolidated
// Claude Haiku call (proxied through rocus-search-api) instead of a 3-step
// local prompt chain. Same return shape ({ summary, topic, query }) so
// processWebsite can use either path interchangeably. On failure, retries
// once, then falls back to the same extractive fallback local mode uses.
export async function generateSummaryTopicQueryViaHaiku(metadata, content) {
	const contentChunk = content.substring(0, 2500);

	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const data = await callHaikuSummarizeOnce(metadata, contentChunk);
			return {
				summary: data.summary || extractFallbackSummary(content, metadata),
				topic: data.topic,
				query: data.search_query || `${metadata.title || ''} ${metadata.domain || ''}`.trim(),
			};
		} catch (err) {
			if (err instanceof QuotaExceededError) throw err; // propagate: no retry, no silent fallback
			console.error(`Haiku summarize attempt ${attempt + 1} failed:`, err);
		}
	}

	return {
		summary: extractFallbackSummary(content, metadata),
		topic: extractTopic(metadata.title, metadata.keywords) || 'General',
		query: `${metadata.title || ''} ${metadata.domain || ''}`.trim(),
	};
}

// Helper: Extract topic from title. Purely keyword-based (no real
// understanding) - so it deliberately filters out the question/auxiliary
// words that dominate article-title phrasing (e.g. "Are Peanuts Good For
// You?" would otherwise yield "Are Peanuts" instead of "Peanuts").
export function extractTopic(title, keywords) {
	if (!title) return null;
	const stopWords = new Set([
		'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or',
		'is', 'are', 'was', 'were', 'be', 'been', 'being',
		'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'shall', 'may', 'might', 'must',
		'you', 'your', 'yours', 'we', 'our', 'ours', 'they', 'their', 'it', 'its',
		'what', 'why', 'how', 'when', 'where', 'which', 'who', 'whom',
		'this', 'that', 'these', 'those',
		'good', 'bad', 'best', 'worst', 'top', 'new',
		'vs', 'guide', 'tips', 'ways', 'things', 'need', 'know', 'make', 'get',
		'all', 'some', 'more', 'most', 'much', 'many', 'no', 'not', 'yes', 'if',
		'so', 'than', 'then', 'but', 'with', 'without', 'about', 'into', 'from', 'by', 'as',
	]);
	const topic = title
		.toLowerCase()
		.split(/\W+/)
		.filter(w => !stopWords.has(w) && w.length > 2)
		.slice(0, 2)
		.join(' ');
	return toTitleCase(topic);
}

// Helper: Extractive fallback summary
export function extractFallbackSummary(content, metadata) {
	if (metadata.description) return metadata.description;

	// Extract first 2-3 meaningful sentences
	const sentences = content
		.substring(0, 1000)
		.split(/[.!?]+/)
		.map(s => s.trim())
		.filter(s => s.length > 30 && s.length < 200);

	return sentences.slice(0, 2).join('. ') + '.';
}

// Echoes completion back to the browser extension (mirrors the existing
// REQUEST_ALBUMS -> ALBUMS_RESPONSE pattern) so a hidden background tab
// opened for a quick-add knows it's safe to close. No-op for the regular
// manual-popup save flow, which never sets extensionRequestId.
function notifyExtensionProcessed(data, success) {
	if (!data.extensionRequestId) return;
	window.postMessage({
		source: "page-summarizer-extension",
		type: "PAGE_METADATA_PROCESSED",
		requestId: data.extensionRequestId,
		success,
	}, "*");
}

// Process website
export async function processWebsite(data) {
	if (!embeddingModel) {
		const ready = await waitFor(() => embeddingReadyPromise, () => !!embeddingModel);
		if (!ready) {
			console.error("Embedding model not loaded");
			notifyExtensionProcessed(data, false);
			return;
		}
	}
	if (processingMode.value === 'local' && !summarizationModel) {
		const ready = await waitFor(() => summarizationReadyPromise, () => !!summarizationModel);
		if (!ready) {
			console.error("Local summarization model not loaded");
			notifyExtensionProcessed(data, false);
			return;
		}
	}

	const placeholderNode = addProcessingPlaceholder(data);

	try {
		const websiteId = generateId();
		const metadata = data.metadata || {};
		const content = data.content || "";



		console.log(`📝 Processing: ${metadata.title || data.url}`);

		// An explicit album chosen in the extension's own "Save to Album" grid
		// always wins. Otherwise: a collaborator viewing /shared/:graphId has no
		// meaningful local album for the extension's own picker to offer
		// (loadSharedGraphData() never populates albums.value in that mode), so
		// only default into the shared graph once they've explicitly opted in
		// via the quick-add routing prompt (quickAddRoutesHere) - never silently
		// redirect a bookmark into someone else's shared graph without asking
		// first. For an ordinary local dashboard, default to whatever album is
		// currently open on screen, matching how processNote() already behaves
		// for in-app note creation - previously this branch always fell through
		// to null, so quick-adding while an album was open silently missed it
		// and the item only ever showed up under History.
		let targetAlbumId;
		if (data.album) {
			targetAlbumId = data.album;
		} else if (remoteGraphId.value || activeShareGraphId.value) {
			// Covers both a collaborator/guest on /shared/:graphId (remoteGraphId)
			// and the owner on their own /dashboard with an actively-shared
			// album selected (activeShareGraphId) - quickAddRoutesHere already
			// defaults correctly for each (route for the owner's own graph,
			// opt-in only for someone else's), so both cases can share one path.
			targetAlbumId = quickAddRoutesHere.value ? effectiveAlbumId() : null;
		} else {
			targetAlbumId = effectiveAlbumId();
		}

		// Generate summary and topic (Web-LLM locally, Claude Haiku in commercial
		// mode, or already computed server-side for a file upload - the upload
		// endpoint runs the identical Claude analysis itself, so there's nothing
		// left to summarize here).
		const { summary, topic, query } = data.precomputedAnalysis
			? data.precomputedAnalysis
			: processingMode.value === 'commercial'
				? await generateSummaryTopicQueryViaHaiku(metadata, content)
				: await generateSummaryAndTopic(metadata, content);

		// Generate embedding from summary (Transformers.js)
		const embeddingText =
			summary || `${metadata.title} ${metadata.description || ""}`.trim();
		const embedding = await generateEmbedding(embeddingText);

		if (!embedding) {
			console.error("Failed to generate embedding");
			return;
		}

		// Store website data
		websites.value[websiteId] = {
			id: websiteId,
			url: data.url,
			title: metadata.title || data.url,
			domain: metadata.domain || new URL(data.url).hostname,
			topic: topic,
			ai_summary: summary,
			search_query: query,
			metadata: metadata,
			album_id: targetAlbumId,
			processed_at: new Date().toISOString(),
			is_file: !!data.is_file,
			file_id: data.file_id || null,
			added_by: currentIdentityKey(),
			added_at: new Date().toISOString(),
		};

		// Store embedding separately (wrapped with provenance: model, dim, normalized, created_at)
		embeddings.value[websiteId] = wrapEmbedding(embedding);

		// Assign to cluster
		const clusterId = assignToCluster(websiteId, topic, embedding, query, targetAlbumId);
		websites.value[websiteId].cluster_id = clusterId;

		// Live-push to a shared graph if relevant - either this device is
		// viewing /shared/:graphId with edit rights, or (just as often) this is
		// the owner's own dashboard and targetAlbumId happens to be actively
		// shared. No-op internally otherwise (checked inside
		// pushNodeUpdateForAlbum) for ordinary local/single-player use, which
		// is the vast majority of traffic.
		pushNodeUpdateForAlbum(targetAlbumId, [
			{ id: websiteId, type: "website", data: { ...websites.value[websiteId], embedding: embeddings.value[websiteId] } },
			{ id: clusterId, type: "cluster", data: clusters.value[clusterId] },
		]);

		addSimilarLinksToCluster(clusterId).catch(err =>
			console.error("Error adding similar links:", err)
		);

		// Let the backend know which local website this uploaded file became,
		// so the "My Files" list can resolve a topic for it later. Fire-and-
		// forget - topic/cluster labels live only in this browser's IndexedDB,
		// this just links the two IDs together server-side.
		if (data.file_id) {
			fetch(`${API_BASE}/api/uploads/${data.file_id}/link`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ websiteId }),
			}).catch(err => console.error('Failed to link uploaded file:', err));
		}

		// Save to IndexedDB
		await saveToIndexedDB();

		removeProcessingPlaceholder(placeholderNode.id);

		showNewDataNotification.value = true;

		setTimeout(() => {
			showNewDataNotification.value = false;
		}, 4000);

		trackEvent('website_saved', {
			has_album: !!data.album
		});

		await refreshData();

		console.log(`✅ Processed: ${websiteId}`);
		notifyExtensionProcessed(data, true);
		promptConsent();
	} catch (err) {
		console.error("Error processing website:", err);
		removeProcessingPlaceholder(placeholderNode.id);
		notifyExtensionProcessed(data, false);
		if (err instanceof QuotaExceededError) {
			openPremiumModal();
		}
	}
}

// A trimmed processWebsite for notes: no Claude call at all (there's nothing
// to summarize - the note text itself is both the content and the thing
// that gets embedded), and cluster assignment goes through
// assignNoteToCluster instead of assignToCluster (joins a real topic on a
// strict match, otherwise falls into the shared "Notes" hub rather than
// spawning its own singleton cluster).
export async function processNote(text, forcedClusterId = null) {
	const trimmed = (text || "").trim();
	if (!trimmed) return;

	if (!embeddingModel) {
		const ready = await waitFor(() => embeddingReadyPromise, () => !!embeddingModel);
		if (!ready) {
			console.error("Embedding model not loaded");
			return;
		}
	}

	const placeholderNode = addProcessingPlaceholder({ metadata: { title: trimmed.slice(0, 40) } });

	try {
		const websiteId = generateId();
		const embedding = await generateEmbedding(trimmed);

		if (!embedding) {
			console.error("Failed to generate embedding for note");
			removeProcessingPlaceholder(placeholderNode.id);
			return;
		}

		const albumId = effectiveAlbumId();
		const title = trimmed.slice(0, 60) || "Note";

		websites.value[websiteId] = {
			id: websiteId,
			url: null,
			title,
			domain: null,
			topic: null,
			ai_summary: trimmed,
			search_query: null,
			metadata: {},
			album_id: albumId,
			processed_at: new Date().toISOString(),
			is_file: false,
			file_id: null,
			is_note: true,
			note_text: trimmed,
			added_by: currentIdentityKey(),
			added_at: new Date().toISOString(),
		};

		embeddings.value[websiteId] = wrapEmbedding(embedding);

		const { clusterId, notesHubClusterId } = assignNoteToCluster(websiteId, embedding, albumId, trimmed, forcedClusterId);
		websites.value[websiteId].cluster_id = clusterId;

		// Live-push to a shared graph if relevant - see the identical comment
		// in processWebsite() above. Also pushes the Notes hub cluster's own
		// updated data whenever this note just established a new hub link -
		// renderGraph() only ever draws that connector by reading
		// notes_hub_links off the NOTES HUB cluster's own side, never the
		// topic cluster's side, so pushing just clusterId here left the
		// server's copy of the Notes hub cluster permanently missing the
		// link (invisible to any other viewer, and erased on this same
		// browser too the next time a merge/catch-up overwrote the local
		// Notes hub cluster with that incomplete server copy).
		const nodesToPush = [
			{ id: websiteId, type: "website", data: { ...websites.value[websiteId], embedding: embeddings.value[websiteId] } },
			{ id: clusterId, type: "cluster", data: clusters.value[clusterId] },
		];
		if (notesHubClusterId) {
			nodesToPush.push({ id: notesHubClusterId, type: "cluster", data: clusters.value[notesHubClusterId] });
		}
		pushNodeUpdateForAlbum(albumId, nodesToPush);

		await saveToIndexedDB();
		removeProcessingPlaceholder(placeholderNode.id);

		showNewDataNotification.value = true;
		setTimeout(() => {
			showNewDataNotification.value = false;
		}, 4000);

		trackEvent('note_saved', { has_album: !!albumId });

		await refreshData();
		console.log(`✅ Note processed: ${websiteId}`);
	} catch (err) {
		console.error("Error processing note:", err);
		removeProcessingPlaceholder(placeholderNode.id);
	}
}

const COMMERCIAL_CONCURRENCY = 4;

// Network-bound Haiku calls (unlike local WebGPU inference) can run in
// parallel. Workers check items.length against the live reactive array on
// every iteration, so items pushed mid-batch (setupMessageListener can queue
// more while a batch is in flight) are still picked up.
async function processQueueConcurrently(items, limit) {
	let nextIndex = 0;
	async function worker() {
		while (true) {
			const i = nextIndex++;
			if (i >= items.length) return;
			await processWebsite(items[i]);
			processedCount.value++;
		}
	}
	const workerCount = Math.min(limit, items.length);
	await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export async function processQueue() {
	if (isProcessing.value || processingQueue.value.length === 0) return;

	isProcessing.value = true;
	processedCount.value = 0;

	if (processingMode.value === 'commercial') {
		await processQueueConcurrently(processingQueue.value, COMMERCIAL_CONCURRENCY);
	} else {
		for (const item of processingQueue.value) {
			await processWebsite(item);
			processedCount.value++;
		}
	}

	processingQueue.value = [];
	processedCount.value = 0;
	isProcessing.value = false;
}

export function setupMessageListener() {
	const listener = (event) => {
		const msg = event.data;

		// make sure it's coming from the extension
		if (!msg || msg.source !== "page-summarizer-extension") return;

		console.log("🎯 Received message:", msg);

		// --- EXISTING HANDLER ---
		if (msg.type === "PAGE_METADATA" && msg.data) {
			// Ask (once per shared graph, never silently) whether FUTURE
			// quick-adds should route into the currently-open shared graph -
			// this item itself still processes under whatever the existing
			// choice is (or the pre-existing default if never asked), since the
			// answer arrives asynchronously after this synchronous handler
			// returns. See maybeShowQuickAddRoutingPrompt() in useSharing.js.
			maybeShowQuickAddRoutingPrompt();
			processingQueue.value.push(msg.data);
			processQueue();
		}

		// --- NEW HANDLER: EXTENSION WANTS ALBUMS ---
		if (msg.type === "REQUEST_ALBUMS") {
			console.log("📥 Extension requested albums");

			// respond back with albums
			window.postMessage(
				{
					source: "page-summarizer-extension",
					type: "ALBUMS_RESPONSE",
					albums: JSON.parse(JSON.stringify(albums.value)) ?? []
				},
				"*"
			);
		}
	};

	window.addEventListener("message", listener);
	return listener;
}

export async function clearModelCache() {
	const confirmed = await rocusConfirm(
		'This will delete downloaded AI models (~300–700MB) and reload the app.\n\n' +
		'Your bookmarks, topics, clusters, and albums will NOT be deleted.',
		{ title: 'Reset AI Model Cache?', confirmText: 'Reset' }
	);

	if (!confirmed) return;

	try {
		// Delete only WebLLM / MLC IndexedDB databases
		if (indexedDB.databases) {
			const databases = await indexedDB.databases();
			for (const db of databases) {
				if (
					db.name &&
					(
						db.name.startsWith('webllm/') ||
						db.name.startsWith('webllm') ||
						db.name.includes('mlc')
					)
				) {
					console.log('Deleting IndexedDB:', db.name);
					indexedDB.deleteDatabase(db.name);
				}
			}
		}

		// Clear related Cache Storage entries
		if ('caches' in window) {
			const keys = await caches.keys();
			for (const key of keys) {
				if (key.includes('webllm') || key.includes('mlc')) {
					console.log('Deleting cache:', key);
					await caches.delete(key);
				}
			}
		}

		await rocusAlert('AI model cache cleared.\n\nReloading…', { title: 'Done' });
		location.reload();

	} catch (err) {
		console.error('Failed to clear AI cache:', err);
		rocusAlert(
			'Could not fully reset AI cache automatically.\n\n' +
			'Please clear site data for rocus.io in browser settings.',
			{ title: 'Reset Failed' }
		);
	}
}

// Loads the local WebLLM summarization engine. Extracted out of loadModels()
// so it can also be called on-demand when a user switches from commercial
// back to local mode mid-session (see setProcessingMode above).
async function loadSummarizationEngine() {
	loadingMessage.value = "Loading AI model from Rocus CDN...";
	const modelConfig = availableModels.value.find(m => m.id === selectedModel.value);
	if (!modelConfig) throw new Error('Model configuration not found');

	console.log(`Loading model from: ${modelConfig.url}`);

	const customModelRecord = {
		model: modelConfig.url,
		model_id: selectedModel.value,
		model_lib: modelConfig.wasm,
	};

	summarizationModel = await CreateMLCEngine(
		selectedModel.value, // 'Qwen2.5-0.5B-Rocus'
		{
			initProgressCallback: (progress) => {
				if (progress && typeof progress.progress === 'number') {
					// This is the ref the visible progress bar in the Model
					// Status panel actually binds to - the earlier code wrote
					// to a different, unread ref here, so the bar never moved.
					downloadProgress.value = Math.round(progress.progress * 100);
				}
				if (progress && progress.text) {
					loadingMessage.value = progress.text;
					console.log(`📦 ${progress.text}`);
				}
			},
			appConfig: {
				useIndexedDBCache: true,
				model_list: [customModelRecord],
			},
			logLevel: 'WARN',
		}
	);

	console.log('✅ Model loaded from Rocus CDN');

	// quick sanity test for summarization LLM
	try {
		await summarizationModel.chat.completions.create({
			messages: [{ role: "user", content: "Say hi" }],
			max_tokens: 5,
			temperature: 0.4,
		});
	} catch (e) {
		// Non-fatal: keep engine but warn
		console.warn("Web-LLM sanity test failed (non-fatal)", e);
	}
}

// Builds the friendly, actionable troubleshooting text shown in the Model
// Status panel's error card - shared by every caller that can fail loading
// the local model (loadModels() at mount, ensureSummarizationModel() when
// triggered from the Settings toggle) so they all surface identical guidance.
function buildModelErrorMessage(err) {
	let errorMessage = 'AI Models Failed to Load\n\n';

	if (err.message.includes('QuotaExceededError') || err.message.includes('quota') || err.message.includes('storage')) {
		errorMessage +=
			'❌ Problem: Browser storage is full\n\n' +
			'✅ Quick Fix:\n' +
			'1. Go to Settings (⚙️ icon)\n' +
			'2. Click "Clear AI Model Cache"\n' +
			'3. Models will re-download fresh\n\n' +
			'Or manually: Chrome Settings → Privacy → Clear browsing data';
	} else if (err.message.includes('WebGPU not supported')) {
		errorMessage +=
			'❌ Problem: Your browser doesn\'t support WebGPU\n\n' +
			'✅ Solutions:\n' +
			'1. Update Chrome to version 113+ (Help → About Chrome)\n' +
			'2. Enable chrome://flags/#enable-unsafe-webgpu\n' +
			'3. Restart browser after enabling\n\n' +
			'Older computers (pre-2016) may not support WebGPU.';
	} else if (err.message.includes('No GPU adapter')) {
		errorMessage +=
			'❌ Problem: Hardware doesn\'t support WebGPU\n\n' +
			'✅ What to try:\n' +
			'1. Update GPU drivers from manufacturer site\n' +
			'2. Check chrome://gpu shows "WebGPU: Hardware accelerated"\n' +
			'3. Try different browser (Edge, Firefox Nightly)\n\n' +
			'Very old hardware (2015 or older) is a hit or miss.';
	} else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
		errorMessage +=
			'❌ Problem: Network or cache error\n\n' +
			'✅ Solutions:\n' +
			'1. Try Incognito mode (Ctrl+Shift+N)\n' +
			'2. Clear cache in Settings\n' +
			'3. Check internet connection\n' +
			'4. Disable VPN/ad blockers temporarily';
	} else {
		errorMessage +=
			`❌ Error: ${err.message}\n\n` +
			'✅ Try this:\n' +
			'1. Clear AI cache in Settings (⚙️)\n' +
			'2. Try Incognito mode\n' +
			'3. Restart browser\n' +
			'4. Check chrome://gpu for issues';
	}

	return errorMessage;
}

// Deduped local-model loader - the one place that actually calls
// loadSummarizationEngine() and owns all the modelLoading/loadingMessage/
// downloadProgress/error bookkeeping around it. Both loadModels() (mount-
// time, if the stored preference is already 'local') and the Settings-toggle
// flow (enterLocalModeGuided(), below) call this instead of loading directly,
// so whichever one arrives second while a load is already in flight just
// joins the same promise instead of starting a second, competing
// CreateMLCEngine() call - that race was exactly what made the loading UI
// look stuck: two callbacks writing the same refs out of order.
let summarizationLoadInFlight = null;

export function ensureSummarizationModel() {
	if (summarizationModel) return Promise.resolve(summarizationModel);
	if (summarizationLoadInFlight) return summarizationLoadInFlight;

	modelLoading.value = true;
	loadingMessage.value = "Loading AI model from Rocus CDN...";
	downloadProgress.value = 0;
	error.value = "";

	summarizationLoadInFlight = loadSummarizationEngine()
		.then(() => {
			modelLoading.value = false;
			loadingMessage.value = "";
			downloadProgress.value = 0;
			return summarizationModel;
		})
		.catch((err) => {
			modelLoading.value = false;
			error.value = buildModelErrorMessage(err);
			showModelStatus.value = true;
			throw err;
		})
		.finally(() => {
			summarizationLoadInFlight = null;
		});

	summarizationReadyPromise = summarizationLoadInFlight;
	return summarizationLoadInFlight;
}

export async function loadModels() {
	modelLoading.value = true;
	loadingMessage.value = "Loading AI models...";
	downloadProgress.value = 0;

	try {
		// transformers.js
		loadingMessage.value = "Loading embedding model (Transformers.js)...";
		embeddingReadyPromise = pipeline(
			"feature-extraction",
			EMBEDDING_MODEL_ID,
			{
				progress_callback: (progress) => {
					// keep the first half of the progress for embeddings
					if (progress.status === "downloading") {
						downloadProgress.value = Math.round(
							(progress.loaded / (progress.total || 1)) * 40
						);
					}
				},
			}
		);
		embeddingModel = await embeddingReadyPromise;


		if (processingMode.value === 'local') {
			await ensureSummarizationModel();
			console.log("✅ Models loaded successfully (embeddings + Web-LLM)");
		} else {
			console.log("✅ Commercial mode - skipping local WebLLM download");
		}

		modelLoading.value = false;
		loadingMessage.value = "";
		downloadProgress.value = 0;
	} catch (err) {
		modelLoading.value = false;
		error.value = buildModelErrorMessage(err);
		showModelStatus.value = true;
		return;
	}
}
