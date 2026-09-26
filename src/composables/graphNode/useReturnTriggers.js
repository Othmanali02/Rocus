/*
 * Copyright (C) 2025-2026 Rocus
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { clusters, websites } from "./useGraphEngine";
import { flashShareToast } from "./useSharing";
import { CHROME_EXTENSION_ID, FIREFOX_EXTENSION_ID } from "./useTutorial";

// Starting defaults, not requirements - tune to taste.
const OLD_THRESHOLD_DAYS = 14;
const NEW_WINDOW_DAYS = 2;
const MIN_OLD_COUNT = 3;
const MIN_NEW_COUNT = 1;

const DAY_MS = 24 * 60 * 60 * 1000;
const WATERMARK_KEY = "rocus-return-trigger-watermarks";

// { [clusterId]: isoTimestampOfNewestSurfacedItem } - a website newer than a
// cluster's own watermark counts as "not yet surfaced," so the exact same
// growth event can never re-fire across sessions, while a genuinely later
// addition still can.
function readWatermarks() {
	try {
		return JSON.parse(localStorage.getItem(WATERMARK_KEY) || "{}");
	} catch {
		return {};
	}
}

function writeWatermarks(map) {
	localStorage.setItem(WATERMARK_KEY, JSON.stringify(map));
}

// One-way, fire-and-forget notify - unlike useTutorial.js's ROCUS_PING (which
// waits, with a timeout, for a ROCUS_PONG reply), there's no response
// contract here, so no artificial timeout/settle dance is needed. Silently
// no-ops if the extension isn't installed or the API is unavailable - this
// is a best-effort ambient nudge, not something that should ever surface an
// error to the user.
function sendInsightToExtension(insight) {
	const message = { type: "ROCUS_INSIGHT_READY", insight };
	try {
		if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
			chrome.runtime.sendMessage(CHROME_EXTENSION_ID, message, () => {
				void chrome.runtime.lastError; // must be read even on success, or Chrome logs a warning
			});
			return;
		}
		if (typeof browser !== "undefined" && browser.runtime?.sendMessage) {
			browser.runtime.sendMessage(FIREFOX_EXTENSION_ID, message).catch(() => {});
			return;
		}
	} catch {
		// chrome.runtime.sendMessage can throw synchronously for a malformed
		// ID or an unexpectedly-absent API - nothing to notify either way.
	}
}

// Detects "a cluster went dormant, then just got new items" and surfaces it
// once: an in-app toast (only visible while GraphNode.vue's own template
// happens to be mounted) plus a relay to the extension (fires regardless of
// route, so its injected swirl can pick it up on any ordinary page later).
// Meant to run exactly once per tab/session, after local data is confirmed
// hydrated - see the ensureHydrated().then(checkReturnTriggers) call in
// App.vue. Not reactive - deliberately not re-evaluated on every later edit
// within the same session, which would be both wasteful and a poor fit for
// what is meant to be a "welcome back" nudge.
export function checkReturnTriggers() {
	const now = Date.now();
	const oldCutoff = now - OLD_THRESHOLD_DAYS * DAY_MS;
	const newCutoff = now - NEW_WINDOW_DAYS * DAY_MS;
	const watermarks = readWatermarks();

	let best = null; // { clusterId, text, newestProcessedAt, score }

	for (const cluster of Object.values(clusters.value)) {
		const members = (cluster.websites || [])
			.map((id) => websites.value[id])
			.filter(Boolean);

		const old = members.filter((w) => new Date(w.processed_at).getTime() < oldCutoff);
		if (old.length < MIN_OLD_COUNT) continue;

		const newItems = members.filter((w) => new Date(w.processed_at).getTime() >= newCutoff);
		if (newItems.length < MIN_NEW_COUNT) continue;

		const watermark = watermarks[cluster.id] ? new Date(watermarks[cluster.id]).getTime() : 0;
		const genuinelyNew = newItems.filter((w) => new Date(w.processed_at).getTime() > watermark);
		if (genuinelyNew.length < MIN_NEW_COUNT) continue;

		const lastOldActivity = old.reduce((max, w) => Math.max(max, new Date(w.processed_at).getTime()), 0);
		const weeksAgo = Math.max(1, Math.round((now - lastOldActivity) / (7 * DAY_MS)));
		const text = `${weeksAgo} week${weeksAgo === 1 ? "" : "s"} ago you saved ${old.length} thing${old.length === 1 ? "" : "s"} about ${cluster.topic}, and ${genuinelyNew.length} new item${genuinelyNew.length === 1 ? "" : "s"} just joined.`;

		const newestProcessedAt = newItems.reduce((max, w) => Math.max(max, new Date(w.processed_at).getTime()), 0);

		// Only one trigger surfaces per check, even if several clusters
		// qualify - a pile of toasts on one page load would undercut the
		// effect rather than enhance it. Others simply remain candidates
		// (their watermark untouched) for a later check.
		if (!best || genuinelyNew.length > best.score) {
			best = { clusterId: cluster.id, text, newestProcessedAt, score: genuinelyNew.length };
		}
	}

	if (!best) return;

	flashShareToast(best.text);
	sendInsightToExtension({
		clusterId: best.clusterId,
		text: best.text,
		// Lets the extension's notification click take the user straight back
		// to the cluster that grew (GraphNode.vue reads ?cluster=<id> and pans/
		// pulses it - see focusDeepLinkedCluster() in useGraphEngine.js).
		// window.location.origin so this resolves correctly in both prod
		// (rocus.io) and dev (localhost:5173, already allowlisted in both
		// extensions' externally_connectable).
		url: `${window.location.origin}/dashboard?cluster=${encodeURIComponent(best.clusterId)}`,
	});

	watermarks[best.clusterId] = new Date(best.newestProcessedAt).toISOString();
	writeWatermarks(watermarks);
}
