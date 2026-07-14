import { ref } from "vue";
import { explodedNode, clusters, websites, saveToIndexedDB } from "./useGraphEngine";
import { useAnalytics } from "../useAnalytics";

// "Discover Similar Websites" modal: Google-search-backed related-link
// lookup for an exploded cluster. Reads explodedNode/clusters/websites from
// useGraphEngine (safe circular import - useGraphEngine calls
// handleDiscoverClick() for "discover" node clicks).

const { trackEvent } = useAnalytics();

const GOOGLE_SEARCH_API_URL = 'https://rocus.io/api/search';

export const showDiscoverModal = ref(false);
export const isLoadingSimilar = ref(false);
export const similarWebsites = ref([]);

export async function googleSearch(query, numResults = 10) {
	if (!query || !query.trim()) {
		console.warn("Empty search query");
		return [];
	}

	try {
		console.log(`🔍 Searching Google via backend API for: '${query}'`);

		// Call your Node.js backend instead of Cloudflare Worker
		const url = new URL(GOOGLE_SEARCH_API_URL);
		url.searchParams.set('q', query);
		url.searchParams.set('num', numResults.toString());

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include' // Include credentials for CORS
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			// Handle rate limiting
			if (response.status === 429) {
				console.warn('⚠️ Rate limit exceeded. Please try again later.');
				throw new Error('Rate limit exceeded. Please try again in 15 minutes.');
			}

			throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success || !data.results) {
			throw new Error('Invalid response from search API');
		}

		console.log(`✅ Found ${data.results.length} search results`);
		return data.results;

	} catch (error) {
		console.error(`⚠️ Google search error for query '${query}':`, error);

		// You can throw the error to handle it in the calling code
		// or return empty array as before
		if (error.message.includes('Rate limit')) {
			throw error; // Propagate rate limit errors
		}

		return [];
	}
}

export async function addSimilarLinksToCluster(clusterId) {
	const cluster = clusters.value[clusterId];
	if (!cluster) return;

	// Initialize similar_links if not present
	if (!cluster.similar_links) {
		cluster.similar_links = {};
	}

	const websiteIds = cluster.websites || [];

	// Get existing URLs in cluster to avoid duplicates
	const existingUrls = new Set();
	for (const wid of websiteIds) {
		const website = websites.value[wid];
		if (website && website.url) {
			existingUrls.add(website.url);
		}
	}

	// Search for each website's query
	for (const wid of websiteIds) {
		const website = websites.value[wid];
		if (!website) continue;

		const searchQuery = website.search_query || website.topic || website.title;

		// Skip if we already have results for this website
		if (!searchQuery || cluster.similar_links[wid]) continue;

		console.log(`🔍 Searching similar links for website: ${website.title}`);

		// Search Google
		const searchResults = await googleSearch(searchQuery, 10);

		// Filter out URLs already in cluster
		const newLinks = searchResults.filter(result =>
			result.url && !existingUrls.has(result.url)
		);

		if (newLinks.length > 0) {
			cluster.similar_links[wid] = newLinks;
			console.log(`🔗 Found ${newLinks.length} similar links for website ${wid}`);
		}
	}

	// Save to IndexedDB
	await saveToIndexedDB();
}

export async function searchSimilarWebsites(query) {
	try {
		console.log("📡 Searching for similar websites:", query);

		if (!explodedNode.value) return [];

		const clusterId = explodedNode.value.id;
		const cluster = clusters.value[clusterId];

		// Ensure similar links are populated for this cluster
		await addSimilarLinksToCluster(clusterId);

		// Collect all similar links from the cluster
		const allSimilarLinks = [];
		const seenUrls = new Set();

		if (cluster.similar_links) {
			for (const [websiteId, links] of Object.entries(cluster.similar_links)) {
				for (const link of links) {
					if (!seenUrls.has(link.url)) {
						seenUrls.add(link.url);
						allSimilarLinks.push(link);
					}
				}
			}
		}

		// If we don't have enough results, do a fresh Google search
		if (allSimilarLinks.length < 5) {
			console.log("🔍 Not enough cached results, performing fresh search");
			const freshResults = await googleSearch(query, 10);

			// Get existing cluster URLs
			const clusterUrls = new Set(
				cluster.websites.map(wid => websites.value[wid]?.url).filter(Boolean)
			);

			for (const result of freshResults) {
				if (!seenUrls.has(result.url) && !clusterUrls.has(result.url)) {
					seenUrls.add(result.url);
					allSimilarLinks.push(result);
				}
			}
		}

		// Sort by relevance (you could implement scoring here)
		// For now, just limit to top 10
		return allSimilarLinks.slice(0, 10);

	} catch (error) {
		console.error("❌ Error searching similar websites:", error);
		return [];
	}
}

export async function handleDiscoverClick() {
	if (!explodedNode.value) return;

	showDiscoverModal.value = true;
	isLoadingSimilar.value = true;
	similarWebsites.value = [];

	trackEvent('discover_similar_clicked', {
		website_count: explodedNode.value.websites.length
	});

	try {
		const results = await searchSimilarWebsites(explodedNode.value.topic);
		similarWebsites.value = results;
	} catch (error) {
		console.error("Error loading similar websites:", error);
	} finally {
		isLoadingSimilar.value = false;
	}
}

export function closeDiscoverModal() {
	showDiscoverModal.value = false;
	similarWebsites.value = [];
}

export function openExternalLink(url) {
	window.open(url, "_blank", "noopener,noreferrer");
}
