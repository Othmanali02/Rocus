import { ref } from "vue";
import { useAnalytics } from "../useAnalytics";
import { albums } from "./useAlbums";
import { currentTheme, applyTheme, themes } from "./useThemes";
import {
	clusters,
	websites,
	embeddings,
	simulation,
	graphData,
	isLoading,
	saveToIndexedDB,
	loadData,
	renderGraph,
} from "./useGraphEngine";
import { normalizeEmbeddingRecord } from "./utils";
import {
	CURRENT_VERSION,
	WEBSITE_FIELDS,
	CLUSTER_FIELDS,
	ALBUM_FIELDS,
	assertDeclaredFields,
	toExportWebsite,
	toExportCluster,
	toExportAlbum,
	fromImportRecord,
	fromImportAlbum,
	migrateToCurrentVersion,
} from "./rocusExportFormat";

// Backup export / restore for all app data (.rocus JSON files).
// The export/import <-> internal-shape mapping itself lives in
// rocusExportFormat.js (kept Vue/browser-free so it's independently
// testable); this file is just the browser-facing orchestration
// (gathering live state, file download/upload, IndexedDB persistence).

const { trackEvent } = useAnalytics();

export const importFileInput = ref(null);

export async function exportAllData() {
	try {
		// Gather all data
		const exportData = {
			version: CURRENT_VERSION,
			exportDate: new Date().toISOString(),
			albums: Object.values(albums.value).map(toExportAlbum),
			clusters: Object.values(clusters.value).map(toExportCluster),
			websites: Object.values(websites.value).map(toExportWebsite),
			embeddings: embeddings.value,
			// App-level display settings, not user data - namespaced so a
			// reader knows not to try to interpret it as bookmark/cluster data.
			_app_settings: {
				theme: {
					id: currentTheme.value.id,
					isDark: currentTheme.value.isDark
				}
			}
		};

		// Fail loudly rather than silently ship a record that's missing a
		// field the schema declares it must have.
		for (const album of exportData.albums) assertDeclaredFields(album, ALBUM_FIELDS, "album");
		for (const cluster of exportData.clusters) assertDeclaredFields(cluster, CLUSTER_FIELDS, "cluster");
		for (const website of exportData.websites) assertDeclaredFields(website, WEBSITE_FIELDS, "website");

		// Convert to JSON
		const jsonString = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });

		// Create download link
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `rocus-backup-${new Date().toISOString().split('T')[0]}.rocus`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		console.log('✅ Data exported successfully');
		trackEvent('data_exported');
	} catch (error) {
		console.error('❌ Error exporting data:', error);
		alert('Failed to export data');
	}
}

// Trigger file input
export function triggerImport() {
	importFileInput.value?.click();
}

// Import function
export async function handleImport(event) {
	const file = event.target.files?.[0];
	if (!file) return;

	const confirmed = confirm(
		'⚠️ Importing will replace ALL current data. Are you sure?\n\nMake sure you have a backup first!'
	);

	if (!confirmed) {
		event.target.value = ''; // Reset input
		return;
	}

	try {
		const text = await file.text();
		const rawImportData = JSON.parse(text);

		// Validate import data
		if (!rawImportData.version || !rawImportData.albums || !rawImportData.clusters || !rawImportData.websites) {
			throw new Error('Invalid Rocus file format');
		}

		const importData = migrateToCurrentVersion(rawImportData);

		isLoading.value = true;

		// Clear existing data
		albums.value = {};
		clusters.value = {};
		websites.value = {};
		embeddings.value = {};

		// Import albums
		for (const album of importData.albums) {
			const mapped = fromImportAlbum(album);
			albums.value[mapped.id] = mapped;
		}

		// Import clusters
		for (const cluster of importData.clusters) {
			const mapped = fromImportRecord(cluster);
			clusters.value[mapped.id] = mapped;
		}

		// Import websites
		for (const website of importData.websites) {
			const mapped = fromImportRecord(website);
			websites.value[mapped.id] = mapped;
		}

		// Import embeddings (normalize legacy bare-array vectors from pre-provenance
		// exports to { model: "unknown", ..., v } so they're never silently compared
		// against vectors from a known model)
		const rawEmbeddings = importData.embeddings || {};
		embeddings.value = Object.fromEntries(
			Object.entries(rawEmbeddings).map(([id, raw]) => [id, normalizeEmbeddingRecord(raw)])
		);

		// Apply theme if included (new files carry it under _app_settings;
		// fall back to the old top-level `theme` key for pre-existing exports)
		const importedTheme = importData._app_settings?.theme || importData.theme;
		if (importedTheme) {
			const theme = themes.find(t => t.id === importedTheme.id);
			if (theme) {
				applyTheme(theme);
			}
		}

		// Save to IndexedDB
		await saveToIndexedDB();
		await loadData();

		if (simulation) {
			simulation.nodes(graphData.nodes);
			simulation.force('link').links(graphData.links);
			simulation.alpha(1).restart();
			renderGraph();
		}

		isLoading.value = false;
		event.target.value = ''; // Reset input

		alert('✅ Data imported successfully!');
		console.log('✅ Import complete');

	} catch (error) {
		isLoading.value = false;
		console.error('❌ Error importing data:', error);
		alert('Failed to import data: ' + error.message);
		event.target.value = ''; // Reset input
	}
}
