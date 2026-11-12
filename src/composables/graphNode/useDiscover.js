/*
 * Copyright (C) 2025-2026 Othman Ali
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { ref } from "vue";
import { explodedNode, clusters, websites, saveToIndexedDB } from "./useGraphEngine";
import { useAnalytics } from "../useAnalytics";

// "Discover Similar Websites" modal: web-search-backed related-link lookup
// for an exploded cluster. Queries go to rocus.io/api/search, which looks
// them up via Serper. OFF by default - nothing is sent unless the user opts
// in ("Web suggestions" in Settings) or clicks "Search once" in the modal. Reads explodedNode/clusters/websites from
// useGraphEngine (safe circular import - useGraphEngine calls
// handleDiscoverClick() for "discover" node clicks).

const { trackEvent } = useAnalytics();

const WEB_SEARCH_API_URL = 'https://rocus.io/api/search';
const WEB_SUGGESTIONS_KEY = 'rocus-web-suggestions';

function readWebSuggestionsSetting() {
	try {
		return localStorage.getItem(WEB_SUGGESTIONS_KEY) === 'on';
	} catch {
		return false;
	}
}

// Opt-in: when false, no saved-page topic or query ever leaves the device
// through this module.
export const webSuggestionsEnabled = ref(readWebSuggestionsSetting());

export function setWebSuggestionsEnabled(enabled) {
	webSuggestionsEnabled.value = !!enabled;
	try {
		localStorage.setItem(WEB_SUGGESTIONS_KEY, enabled ? 'on' : 'off');
	} catch {
		// storage unavailable - setting lasts for this session only
	}
}

// True while the Discover modal is showing its consent screen.
export const needsSearchConsent = ref(false);

export const showDiscoverModal = ref(false);
export const isLoadingSimilar = ref(false);
export const similarWebsites = ref([]);

export async function webSearch(query, numResults = 10) {
	if (!query || !query.trim()) {
		console.warn("Empty search query");
		return [];
	}

	try {
		console.log(`🔍 Web search via backend API for: '${query}'`);

		const url = new URL(WEB_SEARCH_API_URL);
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
		console.error(`⚠️ Web search error for query '${query}':`, error);

		// You can throw the error to handle it in the calling code
		// or return empty array as before
		if (error.message.includes('Rate limit')) {
			throw error; // Propagate rate limit errors
		}

		return [];
	}
}

export async function addSimilarLinksToCluster(clusterId) {
	// Privacy gate: called after every save (useAIModels.js) - must be a
	// no-op unless the user has opted in to web suggestions.
	if (!webSuggestionsEnabled.value) return;

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

		const searchResults = await webSearch(searchQuery, 10);

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

	// Live-push to a shared graph if relevant (no-op internally otherwise) -
	// without this, similar-links suggestions only ever updated this
	// browser's own local copy, silently never reaching any collaborator.
	// Dynamic import - useGraphEngine.js statically imports from this file
	// (handleDiscoverClick), so a static import here of useSharing.js (which
	// itself statically imports from useGraphEngine.js) would close a cycle
	// back to useGraphEngine.js mid-evaluation - the same hazard documented
	// throughout useGraphEngine.js's own dynamic imports of useSharing.js.
	const { pushNodeUpdateForAlbum } = await import("./useSharing");
	pushNodeUpdateForAlbum(cluster.album_id, [{ id: clusterId, type: "cluster", data: cluster }]);
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

		// If we don't have enough results, do a fresh web search
		if (allSimilarLinks.length < 5) {
			console.log("🔍 Not enough cached results, performing fresh search");
			const freshResults = await webSearch(query, 10);

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
	similarWebsites.value = [];

	trackEvent('discover_similar_clicked', {
		website_count: explodedNode.value.websites.length
	});

	if (!webSuggestionsEnabled.value) {
		// Ask first - the consent screen's buttons call searchOnce() or
		// allowWebSuggestionsAndSearch().
		needsSearchConsent.value = true;
		isLoadingSimilar.value = false;
		return;
	}

	await runDiscoverSearch();
}

async function runDiscoverSearch() {
	if (!explodedNode.value) return;
	needsSearchConsent.value = false;
	isLoadingSimilar.value = true;
	try {
		const results = await searchSimilarWebsites(explodedNode.value.topic);
		similarWebsites.value = results;
	} catch (error) {
		console.error("Error loading similar websites:", error);
	} finally {
		isLoadingSimilar.value = false;
	}
}

// One-off search for the cluster topic only - does not enable the per-page
// background lookups.
export async function searchOnce() {
	const node = explodedNode.value;
	if (!node) return;
	needsSearchConsent.value = false;
	isLoadingSimilar.value = true;
	try {
		const clusterUrls = new Set(
			(clusters.value[node.id]?.websites || []).map(wid => websites.value[wid]?.url).filter(Boolean)
		);
		const results = await webSearch(node.topic, 10);
		similarWebsites.value = results.filter(r => r.url && !clusterUrls.has(r.url)).slice(0, 10);
	} catch (error) {
		console.error("Error loading similar websites:", error);
	} finally {
		isLoadingSimilar.value = false;
	}
}

export async function allowWebSuggestionsAndSearch() {
	setWebSuggestionsEnabled(true);
	await runDiscoverSearch();
}

export function closeDiscoverModal() {
	showDiscoverModal.value = false;
	needsSearchConsent.value = false;
	similarWebsites.value = [];
}

export function openExternalLink(url) {
	window.open(url, "_blank", "noopener,noreferrer");
}
