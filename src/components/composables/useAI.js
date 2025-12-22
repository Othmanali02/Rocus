import { ref } from "vue";
import { pipeline, env } from "@xenova/transformers";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { cosineSimilarity } from "../utils/similarity";
import { extractTopic, extractFallbackSummary } from "../utils/textProcessing";

env.allowLocalModels = false;
env.useBrowserCache = true;

export function useAI() {
	const embeddingModel = ref(null);
	const summarizationModel = ref(null);
	const modelLoading = ref(false);
	const loadingMessage = ref("");
	const downloadProgress = ref(0);
	const modelLoadingProgress = ref(0);
	const error = ref("");

	async function loadModels(selectedModel, availableModels) {
		modelLoading.value = true;
		loadingMessage.value = "Loading AI models...";
		downloadProgress.value = 0;

		try {
			// transformers.js
			loadingMessage.value = "Loading embedding model (Transformers.js)...";
			embeddingModel.value = await pipeline(
				"feature-extraction",
				"Xenova/all-MiniLM-L6-v2",
				{
					progress_callback: (progress) => {
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
			const modelConfig = availableModels.find((m) => m.id === selectedModel);
			if (!modelConfig) throw new Error("Model configuration not found");

			console.log(`Loading model from: ${modelConfig.url}`);

			const customModelRecord = {
				model: modelConfig.url,
				model_id: selectedModel,
				model_lib: modelConfig.wasm,
			};

			summarizationModel.value = await CreateMLCEngine(selectedModel, {
				initProgressCallback: (progress) => {
					if (progress && typeof progress.progress === "number") {
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
				logLevel: "WARN",
			});

			console.log("✅ Model loaded from Rocus CDN");

			// Sanity test
			try {
				await summarizationModel.value.chat.completions.create({
					messages: [{ role: "user", content: "Say hi" }],
					max_tokens: 5,
					temperature: 0.4,
				});
			} catch (e) {
				console.warn("Web-LLM sanity test failed (non-fatal)", e);
			}

			modelLoading.value = false;
			loadingMessage.value = "";
			downloadProgress.value = 0;
			console.log("✅ Models loaded successfully");
		} catch (err) {
			modelLoading.value = false;

			let errorMessage = "AI Models Failed to Load\n\n";

			if (
				err.message.includes("QuotaExceededError") ||
				err.message.includes("quota")
			) {
				errorMessage +=
					"❌ Problem: Browser storage is full\n\n✅ Quick Fix:\n1. Go to Settings (⚙️ icon)\n2. Click 'Clear AI Model Cache'\n3. Models will re-download fresh";
			} else if (err.message.includes("WebGPU not supported")) {
				errorMessage +=
					"❌ Problem: Your browser doesn't support WebGPU\n\n✅ Solutions:\n1. Update Chrome to version 113+\n2. Enable chrome://flags/#enable-unsafe-webgpu\n3. Restart browser";
			} else if (err.message.includes("No GPU adapter")) {
				errorMessage +=
					"❌ Problem: Hardware doesn't support WebGPU\n\n✅ What to try:\n1. Update GPU drivers\n2. Check chrome://gpu\n3. Try different browser";
			} else if (err.message.includes("Failed to fetch")) {
				errorMessage +=
					"❌ Problem: Network or cache error\n\n✅ Solutions:\n1. Try Incognito mode\n2. Clear cache\n3. Check internet connection";
			} else {
				errorMessage += `❌ Error: ${err.message}\n\n✅ Try:\n1. Clear AI cache in Settings\n2. Try Incognito mode\n3. Restart browser`;
			}

			error.value = errorMessage;
			throw new Error(errorMessage); // Let parent handle showing modal
		}
	}

	async function generateEmbedding(text) {
		if (!embeddingModel.value) return null;

		try {
			const result = await embeddingModel.value(text, {
				pooling: "mean",
				normalize: true,
			});
			return Array.from(result.data);
		} catch (err) {
			console.error("Error generating embedding:", err);
			return null;
		}
	}

	async function generateSummaryAndTopic(metadata, content) {
		if (!summarizationModel.value) return { summary: "", topic: "", query: "" };

		try {
			const contentChunk = content.substring(0, 2500);

			// Step 1: Generate summary
			const summaryResult =
				await summarizationModel.value.chat.completions.create({
					messages: [
						{
							role: "user",
							content: `Create a detailed 2-3 sentence summary from this webpage content:

TITLE: ${metadata.title}
DESCRIPTION: ${metadata.description || ""}
CONTENT: ${contentChunk}

Write a summary that describes what this page is about, what it offers, and key details. Make it good for semantic search:

Summary:`,
						},
					],
					max_tokens: 120,
					temperature: 0.3,
				});

			const summary =
				summaryResult.choices?.[0]?.message?.content?.trim() ?? "";

			// Step 2 & 3: Generate topic and query in parallel
			const [topicResult, queryResult] = await Promise.all([
				summarizationModel.value.chat.completions.create({
					messages: [
						{
							role: "user",
							content: `Generate the main topic of this page using ONLY one or two words

TITLE: ${metadata.title}
SUMMARY: ${summary}

Main topic:`,
						},
					],
					max_tokens: 10,
					temperature: 0.2,
				}),
				summarizationModel.value.chat.completions.create({
					messages: [
						{
							role: "user",
							content: `Create a Google search query to find this page:

TITLE: ${metadata.title}
DOMAIN: ${metadata.domain}
SUMMARY: ${summary}

Search query:`,
						},
					],
					max_tokens: 20,
					temperature: 0.2,
				}),
			]);

			const topic = topicResult.choices?.[0]?.message?.content?.trim() ?? "";
			const query = queryResult.choices?.[0]?.message?.content?.trim() ?? "";

			return {
				summary:
					summary || metadata.description || contentChunk.substring(0, 200),
				topic:
					topic || extractTopic(metadata.title, metadata.keywords) || "General",
				query: query || `${metadata.title} ${metadata.domain}`.trim(),
			};
		} catch (err) {
			console.error("Error in chained summarization:", err);
			return {
				summary: extractFallbackSummary(content, metadata),
				topic: extractTopic(metadata.title, metadata.keywords) || "General",
				query: `${metadata.title || ""} ${metadata.domain || ""}`.trim(),
			};
		}
	}

	function findSimilarWebsites(
		targetEmbedding,
		excludeId = null,
		albumId = null,
		embeddings,
		websites
	) {
		const similarities = [];

		for (const [websiteId, embedding] of Object.entries(embeddings.value)) {
			if (excludeId && websiteId === excludeId) continue;

			const website = websites.value[websiteId];
			if (!website || website.album_id !== albumId) continue;

			const similarity = cosineSimilarity(targetEmbedding, embedding);
			similarities.push({ websiteId, similarity });
		}

		return similarities.sort((a, b) => b.similarity - a.similarity);
	}

	return {
		embeddingModel,
		summarizationModel,
		modelLoading,
		loadingMessage,
		downloadProgress,
		modelLoadingProgress,
		error,
		loadModels,
		generateEmbedding,
		generateSummaryAndTopic,
		findSimilarWebsites,
	};
}
