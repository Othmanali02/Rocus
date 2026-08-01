// Pure, stateless helper functions shared across the graph page composables.

import { stemmer } from "stemmer";
import { store } from "../../router/store";

// Matches the backend's identityForSession() convention exactly
// (rocusnodejs/server.js) so a node's addedBy can be joined against
// graph_membership.identity_key with no translation step. null when signed
// out - most Rocus usage is anonymous/local, where "who added this" isn't a
// meaningful question until the graph is actually shared.
export function currentIdentityKey() {
	return store.user?.email ? `email:${store.user.email}` : null;
}

// UUID rather than timestamp+random: once a graph can be shared/synced,
// records from two independent installs can meet in the same server-side
// table, and a timestamp+random string has no collision guarantee across
// devices the way it did when every ID only ever had to be unique within one
// browser's own IndexedDB.
export function generateId() {
	return crypto.randomUUID();
}

// Embedding provenance: the model that produced a vector, its dimensionality,
// and whether it's L2-normalized are recorded on the vector itself so the
// data outlives any one in-memory session (IndexedDB, .rocus exports).
export const EMBEDDING_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIM = 384;

export function wrapEmbedding(vector) {
	return {
		model: EMBEDDING_MODEL_ID,
		dim: EMBEDDING_DIM,
		normalized: true,
		created_at: new Date().toISOString(),
		v: vector,
	};
}

// Accepts either an already-wrapped embedding record or a legacy bare
// [float] array (pre-provenance IndexedDB entries / v1.0.0 export files).
// Legacy vectors are tagged "unknown" so they're never silently compared
// against vectors from a known model.
export function normalizeEmbeddingRecord(raw) {
	if (Array.isArray(raw)) {
		return {
			model: "unknown",
			dim: raw.length,
			normalized: null,
			created_at: null,
			v: raw,
		};
	}
	return raw;
}

// Expands a theme hex color (#rgb or #rrggbb) to an rgba() string at the
// given alpha - used instead of CSS color-mix() so themed tint effects work
// on any browser, not just Chrome 111+/equivalents.
export function withAlpha(hex, alpha) {
	if (!hex) return `rgba(0, 0, 0, ${alpha})`;
	let h = hex.replace('#', '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDate(dateString) {
	if (!dateString) return "N/A";
	const date = new Date(dateString);
	return date.toLocaleDateString();
}

// Cosine similarity
export function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}

export function averageEmbeddings(embeddingsArray) {
	if (embeddingsArray.length === 0) return [];

	const dim = embeddingsArray[0].length;
	const avg = new Array(dim).fill(0);

	for (const embedding of embeddingsArray) {
		for (let i = 0; i < dim; i++) {
			avg[i] += embedding[i];
		}
	}

	for (let i = 0; i < dim; i++) {
		avg[i] /= embeddingsArray.length;
	}

	return avg;
}

// Capitalizes each word of a short topic/label (e.g. "machine learning" ->
// "Machine Learning"), normalizing whatever case the source produced.
export function toTitleCase(str) {
	if (!str) return str;
	return str.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// Model output for the per-page/per-cluster caption sometimes arrives wrapped
// in stray quotes (a JSON/quote-wrapper parsing artifact) or cut off mid-word
// by the token cap. This strips the wrapper and never returns a truncated tail.
export function cleanAiLabel(raw, maxLength = 80) {
	if (!raw) return "";

	let cleaned = raw.trim();

	// Strip one layer of wrapping quotes (", ', or “ ” smart quotes)
	const quotePairs = [['"', '"'], ["'", "'"], ["“", "”"]];
	for (const [open, close] of quotePairs) {
		if (cleaned.startsWith(open) && cleaned.endsWith(close) && cleaned.length > 1) {
			cleaned = cleaned.slice(open.length, -close.length).trim();
			break;
		}
	}
	// A lone leading quote with no matching close (truncated before the close
	// quote was ever generated) - drop just the leading character.
	if (/^["'“]/.test(cleaned)) {
		cleaned = cleaned.slice(1).trim();
	}

	if (cleaned.length > maxLength) {
		cleaned = cleaned.slice(0, maxLength).trim();
	}

	return toTitleCase(cleaned);
}

// A label is "dirty" if it still carries the raw-model-output artifacts
// cleanAiLabel is meant to strip - used to flag pre-existing records that
// were written before this cleanup existed, without silently pretending
// they're clean.
export function isDirtyAiLabel(value) {
	if (!value) return false;
	return /^["'“]/.test(value.trim());
}

// A handful of very common words, excluded from the word-overlap check in
// topicsMatch below - now that a lexical match can qualify a cluster on its
// own (no embedding-similarity backstop required, see rankCandidateClusters
// in useGraphEngine.js), a topic that happened to be a common word shouldn't
// trivially match everything that contains it.
const STOPWORDS = new Set([
	"a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with",
	"is", "are", "was", "were", "this", "that", "these", "those", "it", "its",
	"be", "by", "as", "from", "about", "into", "your", "my", "i", "you",
]);

function longestCommonPrefixLength(a, b) {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return i;
}

// Two independent, complementary checks - neither is reliable enough alone.
// Exact stemmed equality (via the standard Porter2/Snowball algorithm)
// correctly handles the vast majority of English inflections: run/running,
// kayak/kayaking, market/marketing. But stemmers are heuristic and DO get
// real words wrong - this exact library over-trims "warehousing" to "wareh"
// while "warehouse" stems to "warehous", so a word that's obviously the same
// root as far as any human is concerned fails a pure stem-equality check.
// The long-shared-prefix check is a robust backstop for exactly that case
// (both share the 8-letter prefix "warehous"), without depending on getting
// English morphology algorithmically "right". The threshold (a fixed
// minimum of 6 characters, or 75% of the shorter word, whichever is larger)
// was tuned to catch that case while explicitly rejecting misleading short
// prefixes (e.g. "china"/"chinatown", "car"/"cartoon", "art"/"article" all
// correctly stay unmatched).
function wordsMatch(w1, w2) {
	if (w1 === w2) return true;
	if (stemmer(w1) === stemmer(w2)) return true;
	const shared = longestCommonPrefixLength(w1, w2);
	return shared >= Math.max(6, 0.75 * Math.min(w1.length, w2.length));
}

export function topicsMatch(topic1, topic2) {
	if (!topic1 || !topic2) return false;

	const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "");

	const n1 = normalize(topic1);
	const n2 = normalize(topic2);

	if (n1 === n2) return true;

	const words1 = n1.split(" ").filter((w) => w && !STOPWORDS.has(w));
	const words2 = n2.split(" ").filter((w) => w && !STOPWORDS.has(w));

	for (const w1 of words1) {
		for (const w2 of words2) {
			if (wordsMatch(w1, w2)) return true;
		}
	}

	const synonyms = {
		gpu: ["graphics card", "video card"],
		cpu: ["processor", "chip"],
		ai: ["artificial intelligence", "machine learning", "ml"],
		phone: ["mobile", "smartphone"],
		laptop: ["notebook", "portable computer"],
	};

	for (const [key, values] of Object.entries(synonyms)) {
		if (n1 === key && values.includes(n2)) return true;
		if (n2 === key && values.includes(n1)) return true;
	}

	return false;
}
