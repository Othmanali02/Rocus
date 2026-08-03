import { ref } from "vue";
import * as d3 from "d3";
import {
	graphData,
	websites,
	svg,
	zoom,
	container,
	graphContainer,
	settings,
} from "./useGraphEngine";

// Search bar state + node highlighting. The current query is the plain
// (non-reactive) value the original component held as `let searchTerm = ""`.
// It's exposed as a getter function (rather than a bare live-binding) so
// useGraphEngine's clearHighlights() can read the live value unambiguously.
let currentSearchTerm = "";
export function searchTerm() { return currentSearchTerm; }

export const searchInput = ref('');
export const matchCount = ref(0);
export const isSearchFocused = ref(false);
export const searchInputRef = ref(null);

// "/" tips panel - a quick reference for how the app works, opened from the
// search bar. State lives here (not GraphNode.vue) alongside the rest of the
// search bar's own state and its one existing global keydown handler.
export const showShortcutsPanel = ref(false);
export function openShortcutsPanel() { showShortcutsPanel.value = true; }
export function closeShortcutsPanel() { showShortcutsPanel.value = false; }

export function performSearch() {
	const term = searchInput.value.toLowerCase().trim();
	currentSearchTerm = term;

	if (!term) {
		clearSearchHighlights();
		matchCount.value = 0;
		return;
	}

	// Deep search: clusters + websites + metadata + summaries
	const matchingNodes = graphData.nodes.filter(node => {
		if (node.type === 'cluster') {
			// Search cluster topic
			if (node.topic?.toLowerCase().includes(term)) return true;

			// Search within cluster's websites
			return node.websites?.some(website => {
				const title = website.title?.toLowerCase() || '';
				const url = website.url?.toLowerCase() || '';
				const domain = website.domain?.toLowerCase() || '';

				// Get full website data for deep search
				const fullWebsite = websites.value[website.id];
				if (fullWebsite) {
					const summary = fullWebsite.ai_summary?.toLowerCase() || '';
					const description = fullWebsite.metadata?.description?.toLowerCase() || '';
					const keywords = fullWebsite.metadata?.keywords?.toLowerCase() || '';

					return title.includes(term) ||
						url.includes(term) ||
						domain.includes(term) ||
						summary.includes(term) ||
						description.includes(term) ||
						keywords.includes(term);
				}

				return title.includes(term) || url.includes(term) || domain.includes(term);
			});
		}

		if (node.type === 'website') {
			const title = node.title?.toLowerCase() || '';
			const url = node.url?.toLowerCase() || '';
			const domain = node.domain?.toLowerCase() || '';

			// Get full website data
			const fullWebsite = websites.value[node.websiteId];
			if (fullWebsite) {
				const summary = fullWebsite.ai_summary?.toLowerCase() || '';
				const description = fullWebsite.metadata?.description?.toLowerCase() || '';
				const keywords = fullWebsite.metadata?.keywords?.toLowerCase() || '';

				return title.includes(term) ||
					url.includes(term) ||
					domain.includes(term) ||
					summary.includes(term) ||
					description.includes(term) ||
					keywords.includes(term);
			}

			return title.includes(term) || url.includes(term) || domain.includes(term);
		}

		return false;
	});

	matchCount.value = matchingNodes.length;
	highlightSearchResults(matchingNodes);

	// Auto-zoom to first match
	if (matchingNodes.length > 0 && svg && zoom && graphContainer.value) {
		const firstMatch = matchingNodes[0];
		const width = graphContainer.value.clientWidth;
		const height = graphContainer.value.clientHeight;

		svg.transition()
			.duration(1000 / settings.animationSpeed)
			.call(
				zoom.transform,
				d3.zoomIdentity
					.translate(width / 2, height / 2)
					.scale(1.2)
					.translate(-firstMatch.x, -firstMatch.y)
			);
	}
}

export function highlightSearchResults(matchingNodes) {
	if (!container) return;

	const matchingIds = new Set(matchingNodes.map(d => d.id));

	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', d => matchingIds.has(d.id) ? 1 : 0.3);

	// stroke-width targets the circle specifically - it carries its own
	// explicit stroke-width attr, which would otherwise shadow anything set
	// on the parent <g>.
	container.select('.nodes')
		.selectAll('.node-circle')
		.attr('stroke-width', d => matchingIds.has(d.id) ? 4 : 2);

	container.select('.labels')
		.selectAll('.node-label')
		.style('opacity', d => matchingIds.has(d.id) ? 1 : 0.3)
		.style('font-weight', d => matchingIds.has(d.id) ? 'bold' : '500');
}

export function clearSearchHighlights() {
	if (!container) return;

	container.select('.nodes')
		.selectAll('.node')
		.style('opacity', 1);

	container.select('.nodes')
		.selectAll('.node-circle')
		.attr('stroke-width', 2);

	container.select('.labels')
		.selectAll('.node-label')
		.style('opacity', 1)
		.style('font-weight', '500');
}

export function clearSearch() {
	searchInput.value = '';
	matchCount.value = 0;
	performSearch();
	focusSearch();
}

// Focus search function
export function focusSearch() {
	isSearchFocused.value = true;
	setTimeout(() => {
		searchInputRef.value?.focus();
	}, 0);
}

// Handle search blur
export function handleSearchBlur() {
	setTimeout(() => {
		if (searchInput.value === '') {
			isSearchFocused.value = false;
		}
	}, 150);
}

// Handle click outside
export function handleClickOutside(event) {
	const searchContainer = event.target.closest('.fixed.top-24');
	if (!searchContainer) {
		if (isSearchFocused.value && !searchInput.value) isSearchFocused.value = false;
		if (showShortcutsPanel.value) showShortcutsPanel.value = false;
	}
}

export function handleKeyDown(event) {
	if (event.key === 'Escape') {
		event.preventDefault();
		if (showShortcutsPanel.value) {
			showShortcutsPanel.value = false;
			return;
		}
		if (isSearchFocused.value) {
			// If already focused, blur and clear
			searchInputRef.value?.blur();
			searchInput.value = '';
			isSearchFocused.value = false;
		} else {
			// If not focused, focus the search
			focusSearch();
		}
		return;
	}

	if (event.key === '/') {
		// Guard against every other free-text field in the app (cluster
		// rename, album name, note textarea, website title, invite email,
		// the "connect clusters" search, and this file's own search input) -
		// without this, typing a literal "/" anywhere would instead toggle
		// this panel out from under the user.
		const el = document.activeElement;
		const tag = el?.tagName;
		const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable;
		if (isTyping) return;
		event.preventDefault();
		showShortcutsPanel.value = !showShortcutsPanel.value;
	}
}
