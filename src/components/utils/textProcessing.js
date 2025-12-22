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
