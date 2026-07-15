#!/usr/bin/env node
// Standalone reader for a .rocus export file (v2.0.0) - written purely from
// SCHEMA.md, not from Rocus's own source. It imports nothing from the app.
// This exists as a check on the schema doc itself: if this script can't be
// written (or breaks) from SCHEMA.md alone, the schema isn't done.
//
// Prints every bookmark, grouped by its cluster, with that cluster's
// outbound edges (its manual connections to other clusters).
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

if (!data.version || !data.version.startsWith("2.")) {
	console.error(
		`This reader only knows the 2.x schema (SCHEMA.md). Got version "${data.version}".`
	);
	process.exit(1);
}

const clustersById = new Map(data.clusters.map((c) => [c.id, c]));
const albumsById = new Map(data.albums.map((a) => [a.id, a]));
const websitesByCluster = new Map();

for (const website of data.websites) {
	const key = website.cluster_id ?? "(uncategorized)";
	if (!websitesByCluster.has(key)) websitesByCluster.set(key, []);
	websitesByCluster.get(key).push(website);
}

console.log(`Rocus export v${data.version}, written ${data.exportDate}`);
console.log(`${data.websites.length} bookmarks, ${data.clusters.length} clusters, ${data.albums.length} albums\n`);

for (const [clusterId, sites] of websitesByCluster) {
	const cluster = clustersById.get(clusterId);
	const label = cluster ? (cluster.ai_label ?? "(untitled cluster)") : "(uncategorized)";
	const album = cluster?.album_id ? albumsById.get(cluster.album_id) : null;

	console.log(`## ${label}${cluster?.ai_label_dirty ? "  [ai_label_dirty]" : ""}`);
	if (album) console.log(`   album: ${album.name}`);

	if (cluster) {
		const edges = cluster.manual_connections
			.map((targetId) => clustersById.get(targetId)?.ai_label ?? targetId)
			.filter(Boolean);
		if (edges.length > 0) {
			console.log(`   connected to: ${edges.join(", ")}`);
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
