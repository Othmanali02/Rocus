import { ref } from "vue";
import { generateId } from "../utils/helpers";
import { topicsMatch, normalizeTopicTerm } from "../utils/textProcessing"; // ADDED normalizeTopicTerm
import { cosineSimilarity } from "../utils/similarity";

export function useClustering() {
	function findSimilarWebsites(
		targetEmbedding,
		excludeId,
		albumId,
		embeddings,
		websites,
		SIMILARITY_THRESHOLD
	) {
		const similarities = [];

		for (const [websiteId, embedding] of Object.entries(embeddings.value)) {
			if (excludeId && websiteId === excludeId) continue;

			const website = websites.value[websiteId];
			if (!website || website.album_id !== albumId) continue;

			const similarity = cosineSimilarity(targetEmbedding, embedding);
			if (similarity >= SIMILARITY_THRESHOLD * 0.7) {
				// Use lower threshold for finding similar
				similarities.push({ websiteId, similarity });
			}
		}

		return similarities.sort((a, b) => b.similarity - a.similarity);
	}

	function assignToCluster(
		websiteId,
		topic,
		embedding,
		searchQuery,
		albumId,
		clusters,
		embeddings,
		websites,
		SIMILARITY_THRESHOLD,
		LOOSE_SIMILARITY_THRESHOLD
	) {
		const normalizedTopic = normalizeTopicTerm(topic);
		const similarWebsites = findSimilarWebsites(
			embedding,
			websiteId,
			albumId,
			embeddings,
			websites,
			SIMILARITY_THRESHOLD
		);

		for (const { websiteId: similarId, similarity } of similarWebsites) {
			for (const [clusterId, cluster] of Object.entries(clusters.value)) {
				if (cluster.album_id !== albumId) continue;

				if (cluster.websites.includes(similarId)) {
					const clusterTopic = cluster.topic;

					if (similarity >= SIMILARITY_THRESHOLD) {
						if (!cluster.websites.includes(websiteId)) {
							cluster.websites.push(websiteId);
						}
						console.log(
							`🔗 Added to cluster ${clusterId} in album ${
								albumId || "All Clusters"
							}`
						);
						return clusterId;
					}

					if (
						similarity >= LOOSE_SIMILARITY_THRESHOLD &&
						topicsMatch(topic, clusterTopic)
					) {
						if (!cluster.websites.includes(websiteId)) {
							cluster.websites.push(websiteId);
						}
						console.log(`🔗 Added to cluster ${clusterId} (loose + topic)`); // FIXED: Added parenthesis
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

		console.log(
			`🆕 Created new cluster: ${newClusterId} in album ${
				albumId || "All Clusters"
			}`
		);
		return newClusterId;
	}

	return {
		assignToCluster,
	};
}
