#!/usr/bin/env node
// Standalone reader for a .rocus export file (v3.0.0) - written purely from
// SCHEMA.md, not from Rocus's own source. It imports nothing from the app.
// This exists as a check on the schema doc itself: if this script can't be
// written (or breaks) from SCHEMA.md alone, the schema isn't done.
//
// Prints every bookmark, grouped by its cluster, with that cluster's
// outbound edges (manual connections to other clusters) and any
// in-library / external "Discover Similar" results.
//
// Usage: node tools/third-party-reader/read-rocus-export.mjs <path-to-.rocus-file>

import { readFile } from "node:fs/promises";

const filePath = process.argv[2];
if (!filePath) {
	console.error("Usage: node read-rocus-export.mjs <path-to-.rocus-file>");
	process.exit(1);
}

const text = await readFile(filePath, "utf8");
const data = JSON.parse(text);

if (!data.version || !data.version.startsWith("3.")) {
	console.error(
		`This reader only knows the 3.x schema (SCHEMA.md). Got version "${data.version}".`
	);
	process.exit(1);
}

const clustersByLocalId = new Map(data.clusters.map((c) => [c.local_id, c]));
const albumsByLocalId = new Map(data.albums.map((a) => [a.local_id, a]));
const bookmarksByUri = new Map(data.websites.map((w) => [w.uri, w]));
const websitesByCluster = new Map();

for (const website of data.websites) {
	const key = website.cluster_id ?? "(uncategorized)";
	if (!websitesByCluster.has(key)) websitesByCluster.set(key, []);
	websitesByCluster.get(key).push(website);
}

// Manual connections are a single deduped top-level list now, keyed by
// cluster local_id - build an adjacency map so each cluster can print its
// own edges without re-scanning the whole list per cluster.
const connections = new Map();
for (const edge of data.edges || []) {
	if (edge.$type !== "io.rocus.link") continue;
	if (!connections.has(edge.from)) connections.set(edge.from, []);
	if (!connections.has(edge.to)) connections.set(edge.to, []);
	connections.get(edge.from).push(edge.to);
	connections.get(edge.to).push(edge.from);
}

console.log(`Rocus export v${data.version}, written ${data.exportDate}`);
console.log(`${data.websites.length} bookmarks, ${data.clusters.length} clusters, ${data.albums.length} albums\n`);

for (const [clusterId, sites] of websitesByCluster) {
	const cluster = clustersByLocalId.get(clusterId);
	const label = cluster ? (cluster.ai_label ?? "(untitled cluster)") : "(uncategorized)";
	const album = cluster?.album_id ? albumsByLocalId.get(cluster.album_id) : null;

	console.log(`## ${label}${cluster?.ai_label_dirty ? "  [ai_label_dirty]" : ""}`);
	if (album) console.log(`   album: ${album.name}`);

	if (cluster) {
		const edges = (connections.get(cluster.local_id) || [])
			.map((targetId) => clustersByLocalId.get(targetId)?.ai_label ?? targetId);
		if (edges.length > 0) {
			console.log(`   connected to: ${edges.join(", ")}`);
		}

		for (const links of Object.values(cluster.similar_links || {})) {
			for (const link of links) {
				const bookmark = bookmarksByUri.get(link.ref);
				if (bookmark) console.log(`   already bookmarked elsewhere: ${bookmark.title}`);
			}
		}
		const suggestionCount = Object.values(cluster.suggestions || {}).reduce((n, list) => n + list.length, 0);
		if (suggestionCount > 0) {
			console.log(`   ${suggestionCount} external suggestion(s) not yet bookmarked`);
		}
	}

	for (const site of sites) {
		console.log(`   - ${site.title}  <${site.url}>`);
		if (site.ai_label_dirty) {
			console.log(`     (ai_label may be corrupted: ${JSON.stringify(site.ai_label)})`);
		}
	}
	console.log("");
}
