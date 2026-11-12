#!/usr/bin/env node
// Regression test for the Cluster.album_id-wins-over-Website.album_id
// precedence rule (task 5): confirmAddWebsites() in useClusterActions.js
// can put a website into a cluster without syncing the website's own
// album_id, so the two can legitimately disagree. toExportWebsite must
// resolve that drift using the cluster's value, and heal it going forward
// (an uncategorized website - no cluster_id - keeps trusting its own field).
//
// Usage: node tools/test-album-precedence.mjs

import { toExportWebsite } from "../src/composables/graphNode/rocusExportFormat.js";

let failures = 0;
function assertEqual(actual, expected, label) {
	if (actual !== expected) {
		failures++;
		console.error(`❌ ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	} else {
		console.log(`✅ ${label}`);
	}
}

const clustersById = {
	cluster1: { id: "cluster1", album_id: "album-B" },
	cluster2: { id: "cluster2", album_id: null },
};

// Drifted: website still thinks it's in album-A, but its cluster says album-B.
const drifted = { id: "site1", url: "https://example.com/a", cluster_id: "cluster1", album_id: "album-A" };
assertEqual(toExportWebsite(drifted, clustersById).album_id, "album-B", "cluster.album_id wins over a stale website.album_id");

// In a cluster with no album: cluster's null wins even though the website
// still carries an old album_id.
const clusteredNoAlbum = { id: "site2", url: "https://example.com/b", cluster_id: "cluster2", album_id: "album-A" };
assertEqual(toExportWebsite(clusteredNoAlbum, clustersById).album_id, null, "cluster.album_id (null) wins even over a non-null website.album_id");

// Uncategorized (no cluster_id at all): the website's own album_id is the
// only signal available, so it must be trusted.
const uncategorized = { id: "site3", url: "https://example.com/c", album_id: "album-A" };
assertEqual(toExportWebsite(uncategorized, clustersById).album_id, "album-A", "website.album_id is trusted when there's no cluster");

// Dangling cluster_id (cluster missing from the map, e.g. already
// deleted): falls back to the website's own field rather than throwing.
const dangling = { id: "site4", url: "https://example.com/d", cluster_id: "does-not-exist", album_id: "album-A" };
assertEqual(toExportWebsite(dangling, clustersById).album_id, "album-A", "dangling cluster_id falls back to website.album_id");

if (failures > 0) {
	console.error(`\n${failures} assertion(s) failed`);
	process.exit(1);
}
console.log("\nAll album-precedence assertions passed");
