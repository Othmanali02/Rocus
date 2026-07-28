// Pure, stateless helper functions shared across the graph page composables.

export function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

export function normalizeTopicTerm(term) {
	if (!term) return "";

	let normalized = term.toLowerCase().trim();

	if (normalized.endsWith("ies")) {
		normalized = normalized.slice(0, -3) + "y";
	} else if (normalized.endsWith("es")) {
		normalized = normalized.slice(0, -2);
	} else if (normalized.endsWith("s")) {
		normalized = normalized.slice(0, -1);
	}

	normalized = normalized.replace(/(ing|ed|er)$/, "");

	return normalized;
}

export function topicsMatch(topic1, topic2) {
	if (!topic1 || !topic2) return false;

	const normalize = (s) => {
		s = s.toLowerCase().trim();
		s = s.replace(/[^a-z0-9 ]/g, "");
		if (s.endsWith("s")) s = s.slice(0, -1);
		return s;
	};

	const n1 = normalize(topic1);
	const n2 = normalize(topic2);

	if (n1 === n2) return true;

	const set1 = new Set(n1.split(" "));
	const set2 = new Set(n2.split(" "));
	const intersection = [...set1].filter((x) => set2.has(x));

	if (intersection.length > 0) return true;

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
