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

// Declared export schema per record type. Fields are inconsistently
// written internally (e.g. cluster_id only exists after a website is
// assigned to a cluster, updated_at only after an album is edited) -
// every declared field is always present in the export, explicit `null`
// when the app never set it, so a reader can tell "absent" apart from
// "the writer forgot".
const WEBSITE_FIELDS = [
	"id", "url", "title", "domain", "ai_label", "ai_label_dirty",
	"ai_summary", "metadata", "album_id", "cluster_id", "processed_at",
];
const CLUSTER_FIELDS = [
	"id", "ai_label", "ai_label_dirty", "websites",
	"similar_links", "manual_connections", "album_id",
];
const ALBUM_FIELDS = ["id", "name", "icon", "cluster_ids", "created_at", "updated_at"];

function withDeclaredFields(record, fields) {
	const result = {};
	for (const field of fields) {
		result[field] = field in record ? record[field] : null;
	}
	return result;
}

// Fails loudly (aborts the export) if a declared field is missing, rather
// than silently shipping an incomplete record - a safety net for schema
// drift if a new write path forgets a field withDeclaredFields would
// otherwise paper over.
function assertDeclaredFields(record, fields, typeName) {
	for (const field of fields) {
		if (!(field in record)) {
			throw new Error(`Export validation failed: ${typeName} "${record.id}" is missing declared field "${field}"`);
		}
	}
}

// `topic` is a generated caption (Web-LLM output), not a controlled
// classification - the export calls it what it is (`ai_label`) so a reader
// doesn't mistake it for authoritative taxonomy. Internally the app keeps
// using `topic` (it's referenced throughout clustering/display code); this
// mapping only applies at the export/import boundary.
function toExportRecord(record) {
	const { topic, ...rest } = record;
	return { ...rest, ai_label: topic ?? null, ai_label_dirty: isDirtyAiLabel(topic) };
}

function fromImportRecord(record) {
	const { ai_label, ai_label_dirty, topic, ...rest } = record;
	return { ...rest, topic: ai_label !== undefined ? ai_label : (topic ?? "") };
}

// `search_query` is a leaked internal prompt (the question Rocus asked
// itself while summarizing the page), not something a user or another
// tool needs - drop it from the portable file entirely. Internally the
// app keeps writing/reading it as before (useDiscover.js falls back to
// topic/title when it's missing, so dropping it here is safe).
function toExportWebsite(website) {
	const { search_query, ...rest } = toExportRecord(website);
	return withDeclaredFields(rest, WEBSITE_FIELDS);
}

function toExportCluster(cluster) {
	return withDeclaredFields(toExportRecord(cluster), CLUSTER_FIELDS);
}

// Rocus's 3 built-in album icons are local asset filenames - meaningless
// to a reader that isn't this app. Map them to portable emoji at the
// export boundary (and back on import) so the app's own display is
// unaffected; anything already portable (emoji, http(s), data:) passes
// through untouched in both directions.
const BUILTIN_ALBUM_ICONS = {
	"RocusFileIcon.png": "📁",
	"RocusFileIconColored.png": "🗂️",
	"RocusFileIconDark.png": "📂",
};
const BUILTIN_ALBUM_ICONS_REVERSE = Object.fromEntries(
	Object.entries(BUILTIN_ALBUM_ICONS).map(([filename, emoji]) => [emoji, filename])
);

function toExportAlbum(album) {
	const mapped = { ...album, icon: BUILTIN_ALBUM_ICONS[album.icon] || album.icon };
	return withDeclaredFields(mapped, ALBUM_FIELDS);
}

function fromImportAlbum(album) {
	return { ...album, icon: BUILTIN_ALBUM_ICONS_REVERSE[album.icon] || album.icon };
}

export async function exportAllData() {
	try {
		// Gather all data
		const exportData = {
			version: '1.0.0',
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
