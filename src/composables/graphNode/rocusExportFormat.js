// Pure mapping between Rocus's internal runtime shape (website/cluster/album
// objects as GraphNode.vue's composables hold them) and the .rocus export
// file shape (documented in SCHEMA.md). No Vue, no browser APIs - this file
// exists so the format itself is testable (round-trip test) independent of
// IndexedDB/DOM, and so useImportExport.js stays a thin orchestrator.
import { normalizeEmbeddingRecord, isDirtyAiLabel } from "./utils.js";

export const CURRENT_VERSION = "2.0.0";

// Declared export schema per record type. Fields are inconsistently
// written internally (e.g. cluster_id only exists after a website is
// assigned to a cluster, updated_at only after an album is edited) -
// every declared field is always present in the export, explicit `null`
// when the app never set it, so a reader can tell "absent" apart from
// "the writer forgot".
export const WEBSITE_FIELDS = [
	"id", "url", "title", "domain", "ai_label", "ai_label_dirty",
	"ai_summary", "metadata", "album_id", "cluster_id", "processed_at",
];
export const CLUSTER_FIELDS = [
	"id", "ai_label", "ai_label_dirty", "websites",
	"similar_links", "manual_connections", "album_id",
];
export const ALBUM_FIELDS = ["id", "name", "icon", "cluster_ids", "created_at", "updated_at"];

export function withDeclaredFields(record, fields) {
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
export function assertDeclaredFields(record, fields, typeName) {
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
export function toExportRecord(record) {
	const { topic, ...rest } = record;
	return { ...rest, ai_label: topic ?? null, ai_label_dirty: isDirtyAiLabel(topic) };
}

export function fromImportRecord(record) {
	const { ai_label, ai_label_dirty, topic, ...rest } = record;
	return { ...rest, topic: ai_label !== undefined ? ai_label : (topic ?? "") };
}

// `search_query` is a leaked internal prompt (the question Rocus asked
// itself while summarizing the page), not something a user or another
// tool needs - drop it from the portable file entirely. Internally the
// app keeps writing/reading it as before (useDiscover.js falls back to
// topic/title when it's missing, so dropping it here is safe).
export function toExportWebsite(website) {
	const { search_query, ...rest } = toExportRecord(website);
	return withDeclaredFields(rest, WEBSITE_FIELDS);
}

export function toExportCluster(cluster) {
	return withDeclaredFields(toExportRecord(cluster), CLUSTER_FIELDS);
}

// Rocus's 3 built-in album icons are local asset filenames - meaningless
// to a reader that isn't this app. Map them to portable emoji at the
// export boundary (and back on import) so the app's own display is
// unaffected; anything already portable (emoji, http(s), data:) passes
// through untouched in both directions.
export const BUILTIN_ALBUM_ICONS = {
	"RocusFileIcon.png": "📁",
	"RocusFileIconColored.png": "🗂️",
	"RocusFileIconDark.png": "📂",
};
export const BUILTIN_ALBUM_ICONS_REVERSE = Object.fromEntries(
	Object.entries(BUILTIN_ALBUM_ICONS).map(([filename, emoji]) => [emoji, filename])
);

export function toExportAlbum(album) {
	const mapped = { ...album, icon: BUILTIN_ALBUM_ICONS[album.icon] || album.icon };
	return withDeclaredFields(mapped, ALBUM_FIELDS);
}

export function fromImportAlbum(album) {
	return { ...album, icon: BUILTIN_ALBUM_ICONS_REVERSE[album.icon] || album.icon };
}

// v1.0.0 files predate ai_label/embedding-provenance/_app_settings/declared
// fields entirely - their records are shaped exactly like the app's internal
// runtime objects (bare `topic`, bare embedding arrays, top-level `theme`,
// filename icons), which is exactly what toExportWebsite/toExportCluster/
// toExportAlbum/normalizeEmbeddingRecord already know how to turn into
// current-shape records. Migrating is just running the same export
// transform on them once, so old backups upgrade to the same shape a fresh
// export produces rather than being read through ad-hoc fallbacks forever.
export function migrateV1ToV2(data) {
	const { theme, ...rest } = data;
	return {
		...rest,
		version: CURRENT_VERSION,
		albums: (data.albums || []).map(toExportAlbum),
		clusters: (data.clusters || []).map(toExportCluster),
		websites: (data.websites || []).map(toExportWebsite),
		embeddings: Object.fromEntries(
			Object.entries(data.embeddings || {}).map(([id, raw]) => [id, normalizeEmbeddingRecord(raw)])
		),
		_app_settings: { theme: theme || null },
	};
}

export function migrateToCurrentVersion(data) {
	if (data.version === CURRENT_VERSION) return data;
	if (data.version && data.version.startsWith("1.")) return migrateV1ToV2(data);
	throw new Error(`Unsupported Rocus export version: ${data.version}`);
}
