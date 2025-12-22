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