/*
 * Rocus benchmark page (bench.html). Dev-only; not linked from the app.
 * Uses the same packages, model URLs, prompts and storage patterns as
 * src/composables/graphNode/useAIModels.js and useGraphEngine.js at main@7738d1a.
 * If those change, update the copies marked COPIED below.
 */
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { pipeline as pipelineV2, env as envV2 } from "@xenova/transformers";
import { ref, toRaw } from "vue";
import { cosineSimilarity, cleanAiLabel } from "../composables/graphNode/utils";

// COPIED from useAIModels.js
envV2.allowLocalModels = false;
envV2.useBrowserCache = true;
const MODEL_CDN_BASE = "https://models.rocus.io";
const QWEN = {
	id: "Qwen2.5-0.5B-Rocus",
	url: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC`,
	wasm: `${MODEL_CDN_BASE}/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/Qwen2-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
};
const EMBEDDING_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const TJS3_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

// ---------- results store ----------
const KEY = "rocus-bench-results";
const R = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
R.loads ||= []; R.errors ||= []; R.corpus ||= {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) { log("localStorage write failed: " + e.message); } };
const $ = (id) => document.getElementById(id);
const logEl = $("log");
function log(msg) { logEl.textContent += msg + "\n"; logEl.scrollTop = logEl.scrollHeight; console.log("[bench]", msg); }
function status(msg) { $("status").textContent = msg; }
const now = () => performance.now();
const r1 = (x) => Math.round(x * 10) / 10;
const heapMB = () => (performance.memory ? r1(performance.memory.usedJSHeapSize / 1048576) : null);
async function storageMB() { const e = await navigator.storage.estimate(); return r1(e.usage / 1048576); }

let engine = null; // WebLLM
let embedder = null; // transformers.js 2.17
let liveIndex = null; // kept alive so Task Manager sees it

function guard(btnId, fn) {
	$(btnId).addEventListener("click", async () => {
		document.querySelectorAll("button").forEach((b) => (b.disabled = true));
		try { await fn(); }
		catch (e) { log(`ERROR in ${btnId}: ${e?.stack || e}`); R.errors.push({ step: btnId, at: new Date().toISOString(), error: String(e?.message || e) }); save(); status("Error, see log"); }
		finally { document.querySelectorAll("button").forEach((b) => (b.disabled = false)); }
	});
}

// ---------- 0. machine ----------
guard("env", async () => {
	const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
	let info = null;
	if (adapter) info = adapter.info || (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : null);
	let uaHigh = null;
	try { uaHigh = await navigator.userAgentData?.getHighEntropyValues(["platform", "platformVersion", "architecture", "model", "fullVersionList"]); } catch {}
	R.machine = {
		at: new Date().toISOString(),
		userAgent: navigator.userAgent,
		uaHigh,
		cores: navigator.hardwareConcurrency,
		deviceMemoryGB: navigator.deviceMemory ?? null,
		webgpu: !!adapter,
		adapter: info ? { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description } : null,
		shaderF16: adapter ? adapter.features.has("shader-f16") : null,
		maxBufferSizeMB: adapter ? r1(adapter.limits.maxBufferSize / 1048576) : null,
		maxStorageBufferMB: adapter ? r1(adapter.limits.maxStorageBufferBindingSize / 1048576) : null,
		storageQuotaMB: r1((await navigator.storage.estimate()).quota / 1048576),
	};
	save();
	log("Machine: " + JSON.stringify(R.machine, null, 1));
	status("Machine info recorded");
});

// ---------- 1. load ----------
guard("clear", async () => {
	const keys = await caches.keys();
	for (const k of keys) await caches.delete(k);
	const dbs = indexedDB.databases ? await indexedDB.databases() : [];
	const gone = [];
	for (const d of dbs) if (d.name && d.name.startsWith("webllm")) { indexedDB.deleteDatabase(d.name); gone.push(d.name); }
	log(`Cleared Cache Storage [${keys.join(", ")}] and IndexedDB [${gone.join(", ")}]. Now tick DevTools > Network > Disable cache and reload.`);
	status("Caches cleared. Reload before the cold run.");
});

async function modelsCached() {
	const tCache = await caches.has("transformers-cache");
	const dbs = indexedDB.databases ? await indexedDB.databases() : [];
	const w = dbs.some((d) => d.name && d.name.startsWith("webllm/model"));
	return { transformers: tCache, webllm: w };
}

async function loadEmbedder() {
	const t = now();
	embedder = await pipelineV2("feature-extraction", EMBEDDING_MODEL_ID);
	return now() - t;
}

async function loadQwen(events) {
	const t = now();
	let lastPhase = null;
	engine = await CreateMLCEngine(QWEN.id, {
		initProgressCallback: (p) => {
			const text = p?.text || "";
			const phase = text.startsWith("Fetching") ? "fetch" : text.includes("from cache") ? "read-cache" : /shader/i.test(text) ? "shaders" : text.startsWith("Finish") ? "finish" : "other";
			if (phase !== lastPhase) { events.push({ ms: Math.round(now() - t), phase, text: text.slice(0, 140) }); lastPhase = phase; }
		},
		appConfig: { useIndexedDBCache: true, model_list: [{ model: QWEN.url, model_id: QWEN.id, model_lib: QWEN.wasm }] },
		logLevel: "WARN",
	});
	events.push({ ms: Math.round(now() - t), phase: "done" });
	return now() - t;
}

guard("load", async () => {
	if (engine) { log("Models already loaded in this page. Reload the page for a clean run."); return; }
	const cached = await modelsCached();
	const kind = cached.transformers && cached.webllm ? "warm" : !cached.transformers && !cached.webllm ? "cold" : "partial";
	status(`Loading (${kind})...`);
	const run = { kind, at: new Date().toISOString(), cachedBefore: cached, heapBeforeMB: heapMB(), storageBeforeMB: await storageMB() };
	const tAll = now();
	run.minilmLoadMs = Math.round(await loadEmbedder());
	log(`MiniLM (Transformers.js 2.17) loaded in ${run.minilmLoadMs} ms`);
	run.qwenEvents = [];
	run.qwenLoadMs = Math.round(await loadQwen(run.qwenEvents));
	log(`Qwen (WebLLM) loaded in ${run.qwenLoadMs} ms`);
	// first token: a tiny request, so "ready" includes the first-run kernel warmup
	const tf = now();
	await engine.chat.completions.create({ messages: [{ role: "user", content: "Say ok." }], max_tokens: 2, temperature: 0 });
	run.firstTinyCompletionMs = Math.round(now() - tf);
	run.totalReadyMs = Math.round(now() - tAll);
	run.heapAfterMB = heapMB();
	run.storageAfterMB = await storageMB();
	run.storageDeltaMB = r1(run.storageAfterMB - run.storageBeforeMB);
	R.loads.push(run); save();
	log(`Load (${kind}): ${JSON.stringify(run, null, 1)}`);
	status(`Load done (${kind}). Fill "after load" Task Manager readings now.`);
});

guard("tm_save", async () => {
	const g = (id) => { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : null; };
	R.taskManagerMB = {
		before: { tab: g("tm_before_tab"), gpu: g("tm_before_gpu") },
		afterLoad: { tab: g("tm_loaded_tab"), gpu: g("tm_loaded_gpu") },
		afterInferenceAndIndex: { tab: g("tm_peak_tab"), gpu: g("tm_peak_gpu") },
	};
	save(); log("Task Manager readings: " + JSON.stringify(R.taskManagerMB));
});

// ---------- the app's per-save pipeline (COPIED prompts from generateSummaryAndTopic) ----------
async function rocusPipeline(metadata, content) {
	const contentChunk = content.substring(0, 2500);
	const t0 = now();
	const summaryResult = await engine.chat.completions.create({
		messages: [{ role: "user", content: `Create a detailed 2-3 sentence summary from this webpage content:

TITLE: ${metadata.title}
DESCRIPTION: ${metadata.description || ""}
CONTENT: ${contentChunk}

Write a summary that describes what this page is about, what it offers, and key details. Make it good for semantic search:

Summary:` }],
		max_tokens: 120,
		temperature: 0.3,
	});
	const summary = summaryResult.choices?.[0]?.message?.content?.trim() ?? "";
	const tSummary = now() - t0;
	const [topicResult, queryResult] = await Promise.all([
		engine.chat.completions.create({
			messages: [{ role: "user", content: `Name the underlying subject or category this page is about, using ONLY one or two words like a noun phrase. Do not just repeat or rephrase words from the title - identify what it's actually about.

TITLE: ${metadata.title}
SUMMARY: ${summary}

Main topic:` }],
			max_tokens: 10,
			temperature: 0.2,
		}),
		engine.chat.completions.create({
			messages: [{ role: "user", content: `Create a Google search query to find this page:

TITLE: ${metadata.title}
DOMAIN: ${metadata.domain}
SUMMARY: ${summary}

Search query:` }],
			max_tokens: 20,
			temperature: 0.2,
		}),
	]);
	const rawTopic = topicResult.choices?.[0]?.message?.content ?? "";
	return {
		summary,
		rawTopic,
		topic: cleanAiLabel(rawTopic),
		query: queryResult.choices?.[0]?.message?.content?.trim() ?? "",
		ms: Math.round(now() - t0),
		summaryMs: Math.round(tSummary),
		usage: summaryResult.usage ? { prompt: summaryResult.usage.prompt_tokens, completion: summaryResult.usage.completion_tokens, extra: summaryResult.usage.extra || null } : null,
	};
}

async function embedV2(text) {
	const out = await embedder(text, { pooling: "mean", normalize: true });
	return Array.from(out.data); // as generateEmbedding() does
}

let corpusCache = null;
async function corpus() { if (!corpusCache) corpusCache = await (await fetch("/bench/reuters-labelled.json")).json(); return corpusCache; }

// ---------- 2. per-save + index ----------
guard("infer", async () => {
	if (!engine || !embedder) { log("Run step 1 in this page load first."); return; }
	const docs = (await corpus()).slice(0, 5);
	const saves = [];
	for (const [i, d] of docs.entries()) {
		status(`Per-save ${i + 1}/5`);
		const p = await rocusPipeline({ title: d.title, description: "", domain: "reuters.com" }, d.content);
		const te = now();
		await embedV2(p.summary || d.title);
		p.embedMs = r1(now() - te);
		saves.push({ ms: p.ms, summaryMs: p.summaryMs, embedMs: p.embedMs, usage: p.usage, summaryChars: p.summary.length, topic: p.topic });
		log(`save ${i + 1}: ${p.ms} ms LLM (${p.summaryMs} summary) + ${p.embedMs} ms embed | topic "${p.topic}" | ${JSON.stringify(p.usage?.extra || {})}`);
	}

	const idx = await runIndexBench(Array.from(await embedV2("gold prices rise on dollar weakness")));
	R.perSave = {
		at: new Date().toISOString(),
		saves,
		...idx,
	};
	save();
	log("Per-save + index: " + JSON.stringify(R.perSave, null, 1));
	status('Done. Fill the "after inference + 10k index" Task Manager readings, then Save readings.');
});

async function runIndexBench(q) {
	// Index the way Rocus holds it: ref({}) of wrapEmbedding() records with plain double arrays.
	status("Building 10k index...");
	const N = 10000, dim = 384;
	const recs = {};
	for (let i = 0; i < N; i++) {
		const v = new Array(dim); let n = 0;
		for (let k = 0; k < dim; k++) { v[k] = Math.random() - 0.5; n += v[k] * v[k]; }
		n = Math.sqrt(n); for (let k = 0; k < dim; k++) v[k] /= n;
		recs["w" + i] = { model: EMBEDDING_MODEL_ID, dim, normalized: true, created_at: new Date().toISOString(), v };
	}
	const heapIndexMB = heapMB();
	const emb = ref(recs);
	liveIndex = emb;
	const scan = (src) => { const out = []; for (const [id, e] of Object.entries(src)) out.push({ id, s: cosineSimilarity(q, e.v) }); out.sort((a, b) => b.s - a.s); return out; };
	scan(emb.value);
	let t = now(); scan(emb.value); scan(emb.value); const reactiveMs = (now() - t) / 2;
	t = now(); scan(toRaw(emb.value)); scan(toRaw(emb.value)); const rawMs = (now() - t) / 2;
	const flat = new Float32Array(N * dim); Object.values(recs).forEach((r, i) => flat.set(r.v, i * dim));
	const q32 = Float32Array.from(q);
	t = now(); for (let rep = 0; rep < 10; rep++) { for (let i = 0; i < N; i++) { let s = 0; const o = i * dim; for (let k = 0; k < dim; k++) s += q32[k] * flat[o + k]; } } const flatMs = (now() - t) / 10;

	// saveToIndexedDB()'s embeddings loop (clear + one awaited put per record, JSON round-trip), in a scratch DB
	const idbSave = {};
	for (const n of [1000, 10000]) {
		status(`Timing the save path at ${n} records...`);
		idbSave[n] = Math.round(await timeIdbSave(emb.value, n));
		log(`save path at ${n}: ${idbSave[n]} ms`);
	}

	return { index10k: { heapMBAfterBuild: heapIndexMB, heapMBNow: heapMB(), scanMsReactive: r1(reactiveMs), scanMsNoProxy: r1(rawMs), scanMsFloat32: r1(flatMs) }, saveToIndexedDBEmbeddingsMs: idbSave };
}

async function timeIdbSave(reactiveMap, n) {
	const name = "rocus-bench-scratch";
	await new Promise((res) => { const r = indexedDB.deleteDatabase(name); r.onsuccess = r.onerror = r.onblocked = res; });
	const db = await new Promise((res, rej) => {
		const r = indexedDB.open(name, 1);
		r.onupgradeneeded = () => r.result.createObjectStore("embeddings", { keyPath: "id" });
		r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
	});
	const entries = Object.entries(reactiveMap).slice(0, n);
	const t = now();
	const tx = db.transaction(["embeddings"], "readwrite");
	const store = tx.objectStore("embeddings");
	await new Promise((res, rej) => { const r = store.clear(); r.onsuccess = res; r.onerror = () => rej(r.error); });
	for (const [id, embedding] of entries) {
		const plain = { id, embedding: JSON.parse(JSON.stringify(embedding)) };
		await new Promise((res, rej) => { const r = store.put(plain); r.onsuccess = res; r.onerror = () => rej(r.error); });
	}
	await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
	const ms = now() - t;
	db.close();
	indexedDB.deleteDatabase(name);
	return ms;
}

// ---------- 3. WASM vs WebGPU ----------
async function tjs3() { return await import(/* @vite-ignore */ TJS3_URL); }

guard("minilm", async () => {
	const docs = (await corpus()).slice(0, 100).map((d) => `${d.title}. ${d.content.slice(0, 300)}`);
	const res = { at: new Date().toISOString(), docs: docs.length };
	const timeSingles = async (fn) => { for (const d of docs.slice(0, 3)) await fn(d); const t = now(); for (const d of docs) await fn(d); return r1((now() - t) / docs.length); };

	status("MiniLM: Transformers.js 2.17 (WASM, what the app ships)");
	if (!embedder) await loadEmbedder();
	res.v2_wasm_q8_msPerDoc = await timeSingles((d) => embedder(d, { pooling: "mean", normalize: true }));
	log(`2.17 WASM (q8): ${res.v2_wasm_q8_msPerDoc} ms/doc`);
	const ref2 = Array.from((await embedder(docs[0], { pooling: "mean", normalize: true })).data);

	const T = await tjs3();
	T.env.allowLocalModels = false;
	for (const [device, dtype] of [["wasm", "q8"], ["webgpu", "fp32"], ["webgpu", "fp16"]]) {
		const label = `v3_${device}_${dtype}`;
		try {
			if (device === "webgpu" && !navigator.gpu) { res[label] = "no WebGPU"; continue; }
			status(`MiniLM: Transformers.js 3.8 ${device} ${dtype}`);
			const t = now();
			const p = await T.pipeline("feature-extraction", EMBEDDING_MODEL_ID, { device, dtype });
			const loadMs = Math.round(now() - t);
			const single = await timeSingles((d) => p(d, { pooling: "mean", normalize: true }));
			const tb = now(); await p(docs, { pooling: "mean", normalize: true }); const batch = r1((now() - tb) / docs.length);
			const v = Array.from((await p(docs[0], { pooling: "mean", normalize: true })).data);
			res[label] = { loadMs, msPerDocSingle: single, msPerDocBatch100: batch, cosineVsAppEmbedding: r1(cosineSimilarity(ref2, v) * 1000) / 1000 };
			log(`${label}: ${JSON.stringify(res[label])}`);
			await p.dispose?.();
		} catch (e) { res[label] = "error: " + (e?.message || e); log(`${label} failed: ${e?.message || e}`); }
	}
	R.minilmBackends = res; save();
	status("MiniLM backends done");
});

guard("qwenfallback", async () => {
	const T = await tjs3();
	T.env.allowLocalModels = false;
	const docs = (await corpus()).slice(0, 3);
	const res = { at: new Date().toISOString(), model: "onnx-community/Qwen2.5-0.5B-Instruct" };
	const gpu = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
	const configs = [["wasm", "q4"], ["webgpu", gpu?.features.has("shader-f16") ? "q4f16" : "q4"]];
	for (const [device, dtype] of configs) {
		const label = `${device}_${dtype}`;
		try {
			if (device === "webgpu" && !gpu) { res[label] = "no WebGPU"; continue; }
			status(`Qwen via Transformers.js: ${label} (downloading/loading)`);
			const t = now();
			const gen = await T.pipeline("text-generation", res.model, { device, dtype });
			const loadMs = Math.round(now() - t);
			const runs = [];
			for (const d of docs) {
				status(`Qwen via Transformers.js: ${label}, generating`);
				const msgs = [{ role: "user", content: `Create a detailed 2-3 sentence summary from this webpage content:\n\nTITLE: ${d.title}\nDESCRIPTION: \nCONTENT: ${d.content.substring(0, 2500)}\n\nWrite a summary that describes what this page is about, what it offers, and key details. Make it good for semantic search:\n\nSummary:` }];
				const tg = now();
				const out = await gen(msgs, { max_new_tokens: 120, do_sample: false });
				const ms = now() - tg;
				const text = out[0].generated_text.at(-1).content;
				const outTokens = gen.tokenizer.encode(text).length;
				runs.push({ ms: Math.round(ms), outTokens, tokPerSecIncludingPrefill: r1(outTokens / (ms / 1000)) });
			}
			res[label] = { loadMs, runs };
			log(`${label}: ${JSON.stringify(res[label])}`);
			await gen.dispose?.();
		} catch (e) { res[label] = "error: " + (e?.message || e); log(`${label} failed: ${e?.message || e}`); }
	}
	R.qwenBackends = res; save();
	status("Qwen backends done");
});

// ---------- 4. labelled corpus through the real pipeline ----------
guard("corpus", async () => {
	if (!engine || !embedder) { log("Run step 1 in this page load first."); return; }
	const docs = await corpus();
	const t = now();
	let done = Object.keys(R.corpus).length;
	for (const d of docs) {
		if (R.corpus[d.id]) continue;
		const p = await rocusPipeline({ title: d.title, description: "", domain: "reuters.com" }, d.content);
		R.corpus[d.id] = { summary: p.summary, rawTopic: p.rawTopic, topic: p.topic, query: p.query, ms: p.ms };
		save();
		done++;
		status(`Corpus ${done}/${docs.length}`);
		if (done % 25 === 0) log(`corpus ${done}/${docs.length}, last: "${p.topic}" / ${p.summary.slice(0, 80)}`);
	}
	log(`Corpus done: ${done} docs in this pass, ${Math.round((now() - t) / 1000)} s`);
	status("Corpus done. Download results.json.");
});

// ---------- results ----------
guard("download", async () => {
	const out = JSON.parse(JSON.stringify(R));
	const docs = await corpus();
	const ids = Object.keys(R.corpus);
	if (ids.length) {
		status("Embedding corpus summaries for the download...");
		if (!embedder) await loadEmbedder();
		const round = (v) => v.map((x) => Math.round(x * 1e5) / 1e5);
		out.corpusDocs = [];
		for (const d of docs) {
			const c = R.corpus[d.id];
			if (!c) continue;
			out.corpusDocs.push({
				id: d.id, label: d.label, title: d.title, topic: c.topic, rawTopic: c.rawTopic, summary: c.summary,
				embSummary: round(await embedV2(c.summary || d.title)), // what the app embeds
				embRaw: round(await embedV2(`${d.title}. ${d.content.slice(0, 300)}`)), // comparison: no LLM in the path
			});
		}
		delete out.corpus;
	}
	const blob = new Blob([JSON.stringify(out)], { type: "application/json" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = `rocus-bench-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
	a.click();
	status("Downloaded");
});

guard("wipe", async () => {
	if (!confirm("Clear all stored benchmark results in this browser?")) return;
	localStorage.removeItem(KEY);
	location.reload();
});

log(`Stored so far: ${R.loads.length} load run(s)${R.machine ? ", machine" : ""}${R.perSave ? ", per-save" : ""}${R.minilmBackends ? ", MiniLM backends" : ""}${R.qwenBackends ? ", Qwen backends" : ""}, corpus ${Object.keys(R.corpus).length}/345.`);

// Self-test without models: bench.html?selftest runs the index + save-path timing on its own.
if (location.search.includes("selftest")) {
	(async () => {
		const q = Array.from({ length: 384 }, () => Math.random() - 0.5);
		const n = Math.hypot(...q); for (let i = 0; i < 384; i++) q[i] /= n;
		log("SELFTEST index: " + JSON.stringify(await runIndexBench(q)));
		status("SELFTEST done");
	})().catch((e) => log("SELFTEST ERROR " + (e?.stack || e)));
}
