#!/usr/bin/env node
// Round-trip test: export -> import -> export must produce identical data.
//
// Reuses the app's own (Vue-free) format mapping from
// src/composables/graphNode/rocusExportFormat.js - this tests that the
// mapping itself is a true bijection, not just that the app "seems to work".
//
// Usage: node tools/round-trip-test.mjs <path-to-.rocus-file>

import { readFile } from "node:fs/promises";
import {
	toExportWebsite,
	toExportCluster,
	toExportAlbum,
	buildManualEdges,
	fromImportRecord,
	fromImportAlbum,
	fromImportCluster,
	fromImportEdges,
	normalizeUrl,
	migrateToCurrentVersion,
} from "../src/composables/graphNode/rocusExportFormat.js";
import { normalizeEmbeddingRecord } from "../src/composables/graphNode/utils.js";

const filePath = process.argv[2];
if (!filePath) {
	console.error("Usage: node tools/round-trip-test.mjs <path-to-.rocus-file>");
	process.exit(1);
}

const raw = JSON.parse(await readFile(filePath, "utf8"));

// Stage 0: get to a canonical current-version export (this is also what a
// real older backup goes through on import in the running app).
const export1 = migrateToCurrentVersion(raw);

// Stage 1 ("import"): map export-shape records back to internal runtime shape.
const internalAlbums = export1.albums.map(fromImportAlbum);
const uriToWebsite = new Map(export1.websites.map((w) => [w.uri, w]));
const internalClustersArr = export1.clusters.map((c) => fromImportCluster(c, uriToWebsite));
const internalClustersById = Object.fromEntries(internalClustersArr.map((c) => [c.id, c]));
fromImportEdges(internalClustersById, export1.edges);
const internalWebsites = export1.websites.map(fromImportRecord);
const internalEmbeddings = Object.fromEntries(
	Object.entries(export1.embeddings || {}).map(([id, raw]) => [id, normalizeEmbeddingRecord(raw)])
);

// Stage 2 ("export again"): map internal runtime shape back to export shape.
const existingUris = new Set(internalWebsites.map((w) => normalizeUrl(w.url)));
const export2 = {
	...export1,
	exportDate: export1.exportDate, // real app would set `new Date().toISOString()` here; excluded from comparison below
	albums: internalAlbums.map((a) => toExportAlbum(a, internalClustersById)),
	clusters: internalClustersArr.map((c) => toExportCluster(c, existingUris)),
	websites: internalWebsites.map((w) => toExportWebsite(w, internalClustersById)),
	edges: buildManualEdges(internalClustersById),
	embeddings: internalEmbeddings,
};

// exportDate legitimately differs between any two real exports (it's a
// timestamp of when the file was written) - excluded from the comparison,
// everything else must be byte-identical.
const canonicalize = (data) => {
	const { exportDate, ...rest } = data;
	return JSON.stringify(rest, null, 2);
};

const json1 = canonicalize(export1);
const json2 = canonicalize(export2);

if (json1 === json2) {
	console.log(`✅ Round-trip OK: ${filePath}`);
	console.log(`   ${export1.websites.length} websites, ${export1.clusters.length} clusters, ${export1.albums.length} albums, ${Object.keys(export1.embeddings || {}).length} embeddings`);
	process.exit(0);
} else {
	console.error(`❌ Round-trip MISMATCH: ${filePath}`);
	// Cheap line-level diff for whoever's debugging this.
	const lines1 = json1.split("\n");
	const lines2 = json2.split("\n");
	const max = Math.max(lines1.length, lines2.length);
	let shown = 0;
	for (let i = 0; i < max && shown < 20; i++) {
		if (lines1[i] !== lines2[i]) {
			console.error(`  line ${i + 1}:`);
			console.error(`    before: ${lines1[i] ?? "<missing>"}`);
			console.error(`    after:  ${lines2[i] ?? "<missing>"}`);
			shown++;
		}
	}
	process.exit(1);
}
