import { ref } from "vue";

export function useSearch() {
	const searchInput = ref("");
	const searchTerm = ref("");
	const matchCount = ref(0);
	const isSearchFocused = ref(false);
	const searchInputRef = ref(null);

	function performSearch(
		graphData,
		websites,
		container,
		svg = null,
		zoom = null,
		graphContainer = null,
		settings = { animationSpeed: 1 }
	) {
		const term = searchInput.value.toLowerCase().trim();
		searchTerm.value = term; // FIXED: was missing .value

		if (!term) {
			clearSearchHighlights(container);
			matchCount.value = 0;
			return;
		}

		// Deep search: clusters + websites + metadata + summaries
		const matchingNodes = graphData.nodes.filter((node) => {
			if (node.type === "cluster") {
				if (node.topic?.toLowerCase().includes(term)) return true;

				return node.websites?.some((website) => {
					const title = website.title?.toLowerCase() || "";
					const url = website.url?.toLowerCase() || "";
					const domain = website.domain?.toLowerCase() || "";

					const fullWebsite = websites.value[website.id];
					if (fullWebsite) {
						const summary = fullWebsite.ai_summary?.toLowerCase() || "";
						const description =
							fullWebsite.metadata?.description?.toLowerCase() || "";
						const keywords =
							fullWebsite.metadata?.keywords?.toLowerCase() || "";

						return (
							title.includes(term) ||
							url.includes(term) ||
							domain.includes(term) ||
							summary.includes(term) ||
							description.includes(term) ||
							keywords.includes(term)
						);
					}

					return (
						title.includes(term) || url.includes(term) || domain.includes(term)
					);
				});
			}

			if (node.type === "website") {
				const title = node.title?.toLowerCase() || "";
				const url = node.url?.toLowerCase() || "";
				const domain = node.domain?.toLowerCase() || "";

				const fullWebsite = websites.value[node.websiteId];
				if (fullWebsite) {
					const summary = fullWebsite.ai_summary?.toLowerCase() || "";
					const description =
						fullWebsite.metadata?.description?.toLowerCase() || "";
					const keywords = fullWebsite.metadata?.keywords?.toLowerCase() || "";

					return (
						title.includes(term) ||
						url.includes(term) ||
						domain.includes(term) ||
						summary.includes(term) ||
						description.includes(term) ||
						keywords.includes(term)
					);
				}

				return (
					title.includes(term) || url.includes(term) || domain.includes(term)
				);
			}

			return false;
		});

		matchCount.value = matchingNodes.length;
		highlightSearchResults(matchingNodes, container);

		// Auto-zoom to first match
		if (matchingNodes.length > 0 && svg && zoom && graphContainer) {
			const firstMatch = matchingNodes[0];
			const width = graphContainer.clientWidth;
			const height = graphContainer.clientHeight;

			svg
				.transition()
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

	function highlightSearchResults(matchingNodes, container) {
		if (!container) return;

		const matchingIds = new Set(matchingNodes.map((d) => d.id));

		container
			.select(".nodes")
			.selectAll(".node")
			.style("opacity", (d) => (matchingIds.has(d.id) ? 1 : 0.3))
			.attr("stroke-width", (d) => (matchingIds.has(d.id) ? 4 : 2));

		container
			.select(".labels")
			.selectAll(".node-label")
			.style("opacity", (d) => (matchingIds.has(d.id) ? 1 : 0.3))
			.style("font-weight", (d) => (matchingIds.has(d.id) ? "bold" : "500"));
	}

	function clearSearchHighlights(container) {
		if (!container) return;

		container
			.select(".nodes")
			.selectAll(".node")
			.style("opacity", 1)
			.attr("stroke-width", 2);

		container
			.select(".labels")
			.selectAll(".node-label")
			.style("opacity", 1)
			.style("font-weight", "500");
	}

	function clearSearch() {
		searchInput.value = "";
		matchCount.value = 0;
		searchTerm.value = "";
	}

	function focusSearch() {
		isSearchFocused.value = true;
		setTimeout(() => {
			searchInputRef.value?.focus();
		}, 0);
	}

	function handleSearchBlur() {
		setTimeout(() => {
			if (searchInput.value === "") {
				isSearchFocused.value = false;
			}
		}, 150);
	}

	return {
		searchInput,
		searchTerm,
		matchCount,
		isSearchFocused,
		searchInputRef,
		performSearch,
		highlightSearchResults,
		clearSearchHighlights,
		clearSearch,
		focusSearch,
		handleSearchBlur,
	};
}
