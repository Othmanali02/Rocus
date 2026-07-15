import { ref, computed } from "vue";
import { pipeline, env } from "@xenova/transformers";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { useAnalytics } from "../useAnalytics";
import { promptConsent } from "./useAnalyticsBanner";
import { albums } from "./useAlbums";
import {
	websites,
	embeddings,
	addProcessingPlaceholder,
	removeProcessingPlaceholder,
	assignToCluster,
	saveToIndexedDB,
	refreshData,
} from "./useGraphEngine";
import { addSimilarLinksToCluster } from "./useDiscover";
import { generateId, wrapEmbedding, EMBEDDING_MODEL_ID } from "./utils";

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
export const modelLoadingProgress = ref(0);

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
					content: `Generate the main topic of this page using ONLY one or two words

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
		const topic = topicResult.choices?.[0]?.message?.content?.trim() ?? "";
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

// Helper: Extract topic from title
export function extractTopic(title, keywords) {
	if (!title) return null;
	const stopWords = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or']);
	return title
		.toLowerCase()
		.split(/\W+/)
		.filter(w => !stopWords.has(w) && w.length > 2)
		.slice(0, 2)
		.join(' ');
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

// Process website
export async function processWebsite(data) {
	if (!embeddingModel || !summarizationModel) {
		console.error("Models not loaded");
		return;
	}

	const placeholderNode = addProcessingPlaceholder(data);

	try {
		const websiteId = generateId();
		const metadata = data.metadata || {};
		const content = data.content || "";



		console.log(`📝 Processing: ${metadata.title || data.url}`);

		// Generate summary and topic (Web-LLM)
		const { summary, topic, query } = await generateSummaryAndTopic(
			metadata,
			content
		);

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
			album_id: data.album || null,
			processed_at: new Date().toISOString(),
		};

		// Store embedding separately (wrapped with provenance: model, dim, normalized, created_at)
		embeddings.value[websiteId] = wrapEmbedding(embedding);

		// Assign to cluster
		const clusterId = assignToCluster(websiteId, topic, embedding, query, data.album);
		websites.value[websiteId].cluster_id = clusterId;

		addSimilarLinksToCluster(clusterId).catch(err =>
			console.error("Error adding similar links:", err)
		);

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
		promptConsent();
	} catch (err) {
		console.error("Error processing website:", err);
		removeProcessingPlaceholder(placeholderNode.id);
	}
}

export async function processQueue() {
	if (isProcessing.value || processingQueue.value.length === 0) return;

	isProcessing.value = true;
	processedCount.value = 0;

	for (const item of processingQueue.value) {
		await processWebsite(item);
		processedCount.value++;
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
	const confirmed = confirm(
		'Reset AI Model Cache?\n\n' +
		'This will delete downloaded AI models (~300–700MB) and reload the app.\n\n' +
		'Your bookmarks, topics, clusters, and albums will NOT be deleted.'
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

		alert('✅ AI model cache cleared.\n\nReloading…');
		location.reload();

	} catch (err) {
		console.error('Failed to clear AI cache:', err);
		alert(
			'⚠️ Could not fully reset AI cache automatically.\n\n' +
			'Please clear site data for rocus.io in browser settings.'
		);
	}
}

export async function loadModels() {
	modelLoading.value = true;
	loadingMessage.value = "Loading AI models...";
	downloadProgress.value = 0;

	try {
		// transformers.js
		loadingMessage.value = "Loading embedding model (Transformers.js)...";
		embeddingModel = await pipeline(
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


		// Load Web-LLM from self-hosted CDN
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
						modelLoadingProgress.value = Math.round(progress.progress * 100);
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

		modelLoading.value = false;
		loadingMessage.value = "";
		downloadProgress.value = 0;
		console.log("✅ Models loaded successfully (embeddings + Web-LLM)");
	} catch (err) {
		modelLoading.value = false;
		error.value = err.message || "Failed to load AI models";

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


		error.value = errorMessage;      // set the error text
		showModelStatus.value = true;    // open the modal
		modelLoading.value = false;      // stop loading state

		return;

	}
}
