// Pure mapping between Rocus's internal runtime shape (website/cluster/album
// objects as GraphNode.vue's composables hold them) and the .rocus export
// file shape (documented in SCHEMA.md). No Vue, no browser APIs - this file
// exists so the format itself is testable (round-trip test) independent of
// IndexedDB/DOM, and so useImportExport.js stays a thin orchestrator.
import { normalizeEmbeddingRecord, isDirtyAiLabel } from "./utils.js";

export const CURRENT_VERSION = "3.0.0";

// Declared export schema per record type. Fields are inconsistently
// written internally (e.g. cluster_id only exists after a website is
// assigned to a cluster, updated_at only after an album is edited) -
// every declared field is always present in the export, explicit `null`
// when the app never set it, so a reader can tell "absent" apart from
// "the writer forgot".
export const WEBSITE_FIELDS = [
	"$type", "local_id", "uri", "url", "title", "domain", "ai_label", "ai_label_dirty",
	"ai_summary", "metadata", "album_id", "cluster_id", "processed_at",
];
export const CLUSTER_FIELDS = [
	"$type", "local_id", "ai_label", "ai_label_dirty", "websites",
	"similar_links", "suggestions", "album_id",
];
export const ALBUM_FIELDS = ["$type", "local_id", "name", "icon", "cluster_ids", "created_at", "updated_at"];

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
			throw new Error(`Export validation failed: ${typeName} "${record.local_id}" is missing declared field "${field}"`);
		}
	}
}

// Canonical cross-install bookmark identity. Tracking params/fragments/
// trailing-slash/host-case are exactly the kind of accidental differences
// that would otherwise make the same page look like two different
// bookmarks when comparing two exports (or a fresh export against an
// older one). Not a full URL-canonicalization spec - just the handful of
// differences that actually show up from normal browsing.
const TRACKING_PARAMS = new Set([
	"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
	"gclid", "fbclid", "msclkid", "mc_cid", "mc_eid", "ref", "ref_src", "igshid", "spm",
]);

export function normalizeUrl(rawUrl) {
	let parsed;
	try {
		parsed = new URL(rawUrl);
	} catch {
		// Not a parseable URL - pass through unchanged rather than throw;
		// a malformed url is still the best identity we have for it.
		return rawUrl;
	}

	parsed.hostname = parsed.hostname.toLowerCase();
	parsed.hash = "";

	for (const key of [...parsed.searchParams.keys()]) {
		if (TRACKING_PARAMS.has(key.toLowerCase())) parsed.searchParams.delete(key);
	}
	parsed.searchParams.sort();

	if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
		parsed.pathname = parsed.pathname.slice(0, -1);
	}

	return parsed.toString();
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
	const { local_id, uri, $type, ai_label, ai_label_dirty, topic, ...rest } = record;
	return { ...rest, id: local_id, topic: ai_label !== undefined ? ai_label : (topic ?? "") };
}

// `search_query` is a leaked internal prompt (the question Rocus asked
// itself while summarizing the page), not something a user or another
// tool needs - drop it from the portable file entirely. Internally the
// app keeps writing/reading it as before (useDiscover.js falls back to
// topic/title when it's missing, so dropping it here is safe).
//
// `clustersById` (local_id -> cluster) resolves the website's effective
// album: a website added to a cluster via "Add websites to cluster" never
// gets its own album_id synced to the cluster's (a real gap in the
// internal model - see confirmAddWebsites in useClusterActions.js), so
// Cluster.album_id must win whenever the website is actually in a
// cluster. Only a truly uncategorized website's own album_id is trusted.
export function toExportWebsite(website, clustersById = {}) {
	const cluster = website.cluster_id ? clustersById[website.cluster_id] : null;
	const effectiveAlbumId = cluster ? (cluster.album_id ?? null) : (website.album_id ?? null);

	const { search_query, ...rest } = toExportRecord(website);
	const mapped = {
		...rest,
		$type: "io.rocus.bookmark",
		local_id: website.id,
		uri: normalizeUrl(website.url),
		album_id: effectiveAlbumId,
	};
	return withDeclaredFields(mapped, WEBSITE_FIELDS);
}

function sortedByKey(obj) {
	return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

// Splits a cluster's cached "Discover Similar" search results: an item
// whose URL normalizes to a bookmark already in this export is not an
// external suggestion at all - it's a duplicate hit on something the user
// already has. Those become lightweight `{ ref }` pointers into the
// export's own bookmarks instead of a second copy of the title/url/etc.
// Genuinely-external results (no match) go to a separate `suggestions`
// field so the two are never confused. Keys are sorted so the split is
// stable regardless of which order the source object's keys were in.
function splitSimilarLinks(rawSimilarLinks, existingUris) {
	const refs = {};
	const suggestions = {};
	for (const [websiteId, links] of Object.entries(rawSimilarLinks || {})) {
		for (const link of links) {
			const normalized = normalizeUrl(link.url);
			const bucket = existingUris.has(normalized) ? refs : suggestions;
			if (!bucket[websiteId]) bucket[websiteId] = [];
			bucket[websiteId].push(existingUris.has(normalized) ? { ref: normalized } : link);
		}
	}
	return { refs: sortedByKey(refs), suggestions: sortedByKey(suggestions) };
}

export function toExportCluster(cluster, existingUris = new Set()) {
	const { refs, suggestions } = splitSimilarLinks(cluster.similar_links, existingUris);
	const mapped = {
		...toExportRecord(cluster),
		$type: "io.rocus.cluster",
		local_id: cluster.id,
		similar_links: refs,
		suggestions,
	};
	return withDeclaredFields(mapped, CLUSTER_FIELDS);
}

// Cluster-to-cluster "manual connection" edges, promoted from a field
// nested (twice - once per side) inside each cluster to a first-class,
// deduped, document-level list. The internal model stores each manual
// connection bidirectionally (both clusters list each other); some
// clusters only carry it on one side (asymmetric writes are possible
// through the UI), so this reads from either side and still emits exactly
// one edge per pair. Dangling references to an already-deleted cluster
// (deleteCluster() doesn't clean up other clusters' manual_connections -
// a real gap in the internal model) are silently dropped rather than
// exported as a broken edge. `from`/`to` are the clusters' `local_id`s:
// clusters have no cross-install identity the way bookmarks do (see
// Website.uri), so unlike bookmark refs these are only meaningful within
// this one export.
export function buildManualEdges(clustersById) {
	const seen = new Set();
	const edges = [];
	for (const cluster of Object.values(clustersById)) {
		for (const targetId of cluster.manual_connections || []) {
			if (!clustersById[targetId]) continue;
			const [from, to] = [cluster.id, targetId].sort();
			const key = `${from}::${to}`;
			if (seen.has(key)) continue;
			seen.add(key);
			edges.push({ $type: "io.rocus.link", from, to, source: "manual" });
		}
	}
	edges.sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
	return edges;
}

export function fromImportEdges(clustersByLocalId, edges) {
	for (const edge of edges || []) {
		const from = clustersByLocalId[edge.from];
		const to = clustersByLocalId[edge.to];
		if (!from || !to) continue;
		if (!from.manual_connections.includes(edge.to)) from.manual_connections.push(edge.to);
		if (!to.manual_connections.includes(edge.from)) to.manual_connections.push(edge.from);
	}
}

// Reverses splitSimilarLinks: a `{ ref }` entry is resolved back to a
// full {url, title, domain} blob (looked up by uri in the file's own
// bookmarks) so the internal shape looks the same regardless of whether
// a link started as a ref or a suggestion. Re-exporting re-derives the
// same ref from the resolved url, so this is round-trip safe even though
// the reconstructed blob isn't byte-identical to the original search result.
function resolveSimilarLink(item, uriToWebsite) {
	if (!item.ref) return item;
	const website = uriToWebsite.get(item.ref);
	return website
		? { url: website.url, title: website.title, domain: website.domain }
		: { url: item.ref, title: item.ref };
}

export function fromImportCluster(cluster, uriToWebsite) {
	const merged = {};
	for (const [websiteId, items] of Object.entries(cluster.similar_links || {})) {
		merged[websiteId] = items.map((item) => resolveSimilarLink(item, uriToWebsite));
	}
	for (const [websiteId, items] of Object.entries(cluster.suggestions || {})) {
		merged[websiteId] = (merged[websiteId] || []).concat(items);
	}

	const { suggestions, ...rest } = fromImportRecord(cluster);
	return { ...rest, similar_links: merged, manual_connections: [] };
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

// `cluster_ids` is never actually written by the app (createAlbum/
// updateAlbum always pass it through unchanged, so it's permanently []
// once created) - Cluster.album_id is the only field ever assigned by
// user action, so it's the only source of truth. Rather than export the
// always-empty stored value (or drop the field), it's computed fresh
// from the clusters at export time so a reader gets a correct answer
// without having to do the join itself.
export function toExportAlbum(album, clustersById = {}) {
	const computedClusterIds = Object.values(clustersById)
		.filter((cluster) => cluster.album_id === album.id)
		.map((cluster) => cluster.id)
		.sort();

	const mapped = {
		...album,
		$type: "io.rocus.album",
		local_id: album.id,
		icon: BUILTIN_ALBUM_ICONS[album.icon] || album.icon,
		cluster_ids: computedClusterIds,
	};
	return withDeclaredFields(mapped, ALBUM_FIELDS);
}

// cluster_ids is intentionally not restored - it's derived-only (see
// toExportAlbum above); keeping the app's own storage empty for it
// matches how createAlbum/updateAlbum have always treated the field and
// avoids re-introducing a value that would just go stale again the next
// time cluster membership changes without an album edit.
export function fromImportAlbum(album) {
	const { local_id, $type, cluster_ids, ...rest } = album;
	return {
		...rest,
		id: local_id,
		icon: BUILTIN_ALBUM_ICONS_REVERSE[album.icon] || album.icon,
		cluster_ids: [],
	};
}

// v1.0.0 -> v2.0.0 shape, frozen exactly as v2.0.0 defined it (bare `id`,
// `manual_connections`, no `local_id`/`uri`/`$type`/`suggestions`/`edges` -
// those are v3 concepts, added later by migrateV2ToV3). This can't reuse
// the current toExportWebsite/toExportCluster/toExportAlbum - those always
// produce the *current* version's shape now, which would smuggle v3 fields
// into a document tagged "2.0.0" and confuse migrateV2ToV3 downstream.
const V2_WEBSITE_FIELDS = [
	"id", "url", "title", "domain", "ai_label", "ai_label_dirty",
	"ai_summary", "metadata", "album_id", "cluster_id", "processed_at",
];
const V2_CLUSTER_FIELDS = [
	"id", "ai_label", "ai_label_dirty", "websites",
	"similar_links", "manual_connections", "album_id",
];
const V2_ALBUM_FIELDS = ["id", "name", "icon", "cluster_ids", "created_at", "updated_at"];

function v1WebsiteToV2(website) {
	const { search_query, ...rest } = toExportRecord(website);
	return withDeclaredFields(rest, V2_WEBSITE_FIELDS);
}

function v1ClusterToV2(cluster) {
	return withDeclaredFields(toExportRecord(cluster), V2_CLUSTER_FIELDS);
}

function v1AlbumToV2(album) {
	const mapped = { ...album, icon: BUILTIN_ALBUM_ICONS[album.icon] || album.icon };
	return withDeclaredFields(mapped, V2_ALBUM_FIELDS);
}

// v1.0.0 files predate ai_label/embedding-provenance/_app_settings/declared
// fields entirely - their records are shaped exactly like the app's internal
// runtime objects (bare `topic`, bare embedding arrays, top-level `theme`,
// filename icons), which is exactly what the v1WebsiteToV2/v1ClusterToV2/
// v1AlbumToV2/normalizeEmbeddingRecord helpers above expect as input.
export function migrateV1ToV2(data) {
	const { theme, ...rest } = data;
	return {
		...rest,
		version: "2.0.0",
		albums: (data.albums || []).map(v1AlbumToV2),
		clusters: (data.clusters || []).map(v1ClusterToV2),
		websites: (data.websites || []).map(v1WebsiteToV2),
		embeddings: Object.fromEntries(
			Object.entries(data.embeddings || {}).map(([id, raw]) => [id, normalizeEmbeddingRecord(raw)])
		),
		_app_settings: { theme: theme || null },
	};
}

// v2.0.0 files are already export-shaped (ai_label not topic, theme under
// _app_settings, icon already emoji-mapped, no local_id/uri/$type/edges/
// suggestions) - the opposite problem from v1: they need to be unmapped
// back to internal shape before toExportWebsite/toExportCluster/
// toExportAlbum (which expect internal-shape input) can run again to
// produce the current version's shape.
function v2RecordToInternal(record) {
	const { ai_label, ai_label_dirty, ...rest } = record;
	return { ...rest, topic: ai_label ?? "" };
}

function v2AlbumToInternal(album) {
	return { ...album, icon: BUILTIN_ALBUM_ICONS_REVERSE[album.icon] || album.icon };
}

export function migrateV2ToV3(data) {
	const internalClusters = (data.clusters || []).map(v2RecordToInternal);
	const internalWebsites = (data.websites || []).map(v2RecordToInternal);
	const internalAlbums = (data.albums || []).map(v2AlbumToInternal);

	const clustersById = Object.fromEntries(internalClusters.map((c) => [c.id, c]));
	const existingUris = new Set(internalWebsites.map((w) => normalizeUrl(w.url)));

	return {
		version: CURRENT_VERSION,
		exportDate: data.exportDate,
		albums: internalAlbums.map((a) => toExportAlbum(a, clustersById)),
		clusters: internalClusters.map((c) => toExportCluster(c, existingUris)),
		websites: internalWebsites.map((w) => toExportWebsite(w, clustersById)),
		edges: buildManualEdges(clustersById),
		embeddings: Object.fromEntries(
			Object.entries(data.embeddings || {}).map(([id, raw]) => [id, normalizeEmbeddingRecord(raw)])
		),
		_app_settings: data._app_settings || { theme: data.theme || null },
	};
}

export function migrateToCurrentVersion(data) {
	if (data.version === CURRENT_VERSION) return data;
	if (data.version && data.version.startsWith("2.")) return migrateV2ToV3(data);
	if (data.version && data.version.startsWith("1.")) return migrateV2ToV3(migrateV1ToV2(data));
	throw new Error(`Unsupported Rocus export version: ${data.version}`);
}
