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
import { normalizeEmbeddingRecord, isDirtyAiLabel } from "./utils";

// Backup export / restore for all app data (.rocus JSON files).

const { trackEvent } = useAnalytics();

export const importFileInput = ref(null);

// `topic` is a generated caption (Web-LLM output), not a controlled
// classification - the export calls it what it is (`ai_label`) so a reader
// doesn't mistake it for authoritative taxonomy. Internally the app keeps
// using `topic` (it's referenced throughout clustering/display code); this
// mapping only applies at the export/import boundary.
function toExportRecord(record) {
	const { topic, ...rest } = record;
	const exported = { ...rest, ai_label: topic ?? null };
	if (isDirtyAiLabel(topic)) {
		exported.ai_label_dirty = true;
	}
	return exported;
}

function fromImportRecord(record) {
	const { ai_label, ai_label_dirty, topic, ...rest } = record;
	return { ...rest, topic: ai_label !== undefined ? ai_label : (topic ?? "") };
}

export async function exportAllData() {
	try {
		// Gather all data
		const exportData = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			albums: Object.values(albums.value),
			clusters: Object.values(clusters.value).map(toExportRecord),
			websites: Object.values(websites.value).map(toExportRecord),
			embeddings: embeddings.value,
			theme: {
				id: currentTheme.value.id,
				isDark: currentTheme.value.isDark
			}
		};

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
		const importData = JSON.parse(text);

		// Validate import data
		if (!importData.version || !importData.albums || !importData.clusters || !importData.websites) {
			throw new Error('Invalid Rocus file format');
		}

		isLoading.value = true;

		// Clear existing data
		albums.value = {};
		clusters.value = {};
		websites.value = {};
		embeddings.value = {};

		// Import albums
		for (const album of importData.albums) {
			albums.value[album.id] = album;
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

		// Apply theme if included
		if (importData.theme) {
			const theme = themes.find(t => t.id === importData.theme.id);
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
