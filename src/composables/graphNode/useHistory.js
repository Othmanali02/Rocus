import { computed } from "vue";
import { showAlbumsDropdown } from "./useAlbums";
import {
	clusters,
	simulation,
	graphData,
	loadData,
	renderGraph,
	resetView,
	currentHistoryDay,
	getClusterDayKey,
	remoteGraphId,
	refreshRemoteGraphView,
} from "./useGraphEngine";

// The History view of the switcher dropdown (see useAlbums.js for its
// sibling, the Albums view - both share the same dropdown open/close state
// and "All Clusters" reset). A "day" here is derived on the fly from cluster
// data already in memory, not a stored entity like an album, so there's no
// CRUD here - just grouping + selection.

function formatDayLabel(dayKey) {
	const [year, month, day] = dayKey.split("-").map(Number);
	const date = new Date(year, month - 1, day);

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (date.getTime() === today.getTime()) return "Today";
	if (date.getTime() === yesterday.getTime()) return "Yesterday";
	return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Most-recent-day-first list of every day the user has clusters from, each
// with a count - the History dropdown's equivalent of the Albums list.
export const historyDays = computed(() => {
	const counts = {};
	for (const cluster of Object.values(clusters.value)) {
		const dayKey = getClusterDayKey(cluster);
		if (!dayKey) continue;
		counts[dayKey] = (counts[dayKey] || 0) + 1;
	}

	return Object.entries(counts)
		.sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
		.map(([key, count]) => ({ key, label: formatDayLabel(key), count }));
});

export function selectHistoryDay(dayKey) {
	currentHistoryDay.value = dayKey;
	showAlbumsDropdown.value = false;

	if (remoteGraphId.value) {
		// A shared graph's data lives only in memory (loadSharedGraphData()
		// never persists it to IndexedDB) - loadData() below would instead
		// query THIS BROWSER's own local IndexedDB store, which is wrong/
		// empty here regardless of what the day badges above are showing.
		refreshRemoteGraphView()
			.then(() => setTimeout(() => resetView(), 1000))
			.catch((err) => console.error("Failed to refresh shared graph view for history day:", err));
		return;
	}

	loadData()
		.then(() => {
			if (simulation) {
				simulation.nodes(graphData.nodes);
				simulation.force("link").links(graphData.links);
				simulation.alpha(1).restart();
				renderGraph();
				// Same settle delay selectAlbum() uses (useAlbums.js) - centering
				// immediately would fit the view to the simulation's transient
				// fresh-circle starting layout instead of the settled one.
				setTimeout(() => resetView(), 1000);
			}
		})
		.catch((err) => console.error("Failed to load data for history day:", err));
}

export { formatDayLabel };
