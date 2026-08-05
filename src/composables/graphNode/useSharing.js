import { ref, watch, computed } from "vue";
import {
	clusters,
	websites,
	embeddings,
	currentAlbum,
	currentHistoryDay,
	getClusterDayKey,
	saveToIndexedDB,
	remoteGraphId,
	remoteGraphRole,
	remoteGraphFrozen,
	activeShareGraphId,
	loadSharedGraphData,
	refreshRemoteGraph,
	refreshData,
	clearRemoteGraphState,
	renderRemoteCursors,
} from "./useGraphEngine";
import { createAlbum, iconOptions, albums } from "./useAlbums";
import { generateId, currentIdentityKey } from "./utils";
import { API_BASE } from "../../components/constants/config";
import { openPremiumModal, signInUrl } from "./usePremium";
import { store } from "../../router/store";
import { useAnalytics } from "../useAnalytics";

const { trackEvent } = useAnalytics();

// ---------------------------------------------------------------------------
// Sharing/collaboration. The unit of sharing is a single graph, materialized
// as an Album (see plan doc "Sharing unit") - this composable owns the
// REST calls to /api/shared/* and the per-graph WebSocket connection, and
// hands actual graphData mutation off to useGraphEngine's
// loadSharedGraphData()/refreshRemoteGraph() rather than touching graphData
// directly (import bindings for a `let` export are read-only from outside
// the module that owns them).
// ---------------------------------------------------------------------------

export const isSharePanelOpen = ref(false);
export const activeShareUrl = ref(null);
export const shareMembers = ref([]);
export const sharePublicLinkEnabled = ref(false);
// Whether an anonymous public-link guest may download files attached to
// nodes in this graph - a separate, narrower permission from the public
// link itself. Only ever relevant to the 'guest' role; invited
// collaborators (view or edit) can always download, matching the backend
// rule in GET /api/shared/:graphId/uploads/:fileId/download.
export const sharePublicLinkAllowsDownloads = ref(false);
// The owner's own display name/picture - only meaningful (and only ever
// populated by the server) for non-guest viewers, per the existing privacy
// rule. Lets a collaborator's badge show "who shared this with me," the
// mirror image of the owner's badge showing their collaborators.
export const shareOwnerName = ref(null);
export const shareOwnerPictureUrl = ref(null);
// Raw identity_key of the owner, non-guest only (same gating as the two
// refs above) - shareMembers only ever carries collaborator identity keys,
// never the owner's, so this is needed separately to match the owner's own
// entry against the "presence" WS broadcast's identityKeys array.
export const shareOwnerIdentityKey = ref(null);
export const shareBusy = ref(false);
export const shareError = ref("");
// Who's currently connected to this graph's WebSocket, by identity_key -
// drives the online/offline dot on collaborator avatars. Reset to empty
// whenever the socket disconnects (see disconnectSharedGraphSocket/
// clearRemoteGraphState below) so a stale roster never lingers after leaving
// a graph.
export const onlineIdentityKeys = ref(new Set());

// Resolves a raw added_by identity-key (e.g. "email:x@y.com", as embedded in
// a website/note's own data at creation time) into a display name for the
// "who added this" node tooltip. Never called for a guest viewer (returns
// null) - matches the existing privacy rule elsewhere in this file that a
// guest never sees other identities (see sharedAvatars in GraphNode.vue).
// Deliberately never needs the owner's own raw identity key exposed by the
// server: only the owner and invited members can ever add content to a
// shared graph, so any identity that doesn't match a known member is
// necessarily the owner - a safe inference, not a guess.
export function resolveAddedByName(identityKey) {
	if (!identityKey || remoteGraphRole.value === "guest") return null;
	if (identityKey === currentIdentityKey()) return "You";
	const member = shareMembers.value.find((m) => m.identity_key === identityKey);
	if (member) return member.invited_email;
	return shareOwnerName.value || "the owner";
}

// Themed toast (styled via currentTheme in GraphNode.vue, not hardcoded
// colors like the older showNewDataNotification toast it's modeled after).
// Fired only from deliberate actions (the explicit in-panel Share button,
// Copy, or an actionable error) - NOT from merely opening the share panel,
// which is what clicking the header icon now does.
export const showShareToast = ref(false);
export const shareToastMessage = ref("");
export const shareToastType = ref("success"); // 'success' | 'error'
let shareToastTimer = null;

export function flashShareToast(message, type = "success") {
	shareToastMessage.value = message;
	shareToastType.value = type;
	showShareToast.value = true;
	clearTimeout(shareToastTimer);
	shareToastTimer = setTimeout(() => {
		showShareToast.value = false;
	}, 3500);
}
// Set when a /shared/:graphId load fails (not found, expired, or no access) -
// distinct from shareError, which is about the *sharing* UI, not viewing.
export const sharedGraphLoadError = ref("");
// True specifically when the load failed because the visitor isn't signed in
// at all (server distinguishes this from "genuinely unavailable" - see
// openSharedGraph()'s catch block) - drives showing a Sign In CTA instead of
// just the generic "can't open this" message.
export const sharedGraphNeedsSignIn = ref(false);

const SHARED_GRAPH_IDS_KEY = "rocus-shared-graph-ids";

// Maps albumId -> the graphId it was last shared as, persisted across page
// refreshes. Without this, activeShareGraphId (in-memory only) resets to
// null on every reload, so clicking "Share" again on the same album would
// silently mint a brand-new shared_graphs row instead of resuming the one
// collaborators already have a link to - any permission change made in a
// since-refreshed session would appear to "not stick" because it was really
// being read back from a completely different graph.
export function readSharedGraphIds() {
	try {
		return JSON.parse(localStorage.getItem(SHARED_GRAPH_IDS_KEY) || "{}");
	} catch {
		return {};
	}
}

function rememberSharedGraphId(albumId, graphId) {
	const map = readSharedGraphIds();
	map[albumId] = graphId;
	localStorage.setItem(SHARED_GRAPH_IDS_KEY, JSON.stringify(map));
}

// Pushes a renamed album's new name into the shared graph's own title, so
// collaborators see it too instead of the stale name from whenever it was
// first shared - no-op if this album was never shared. Fire-and-forget, same
// contract as pushNodeUpdateForAlbum/pushNodeDeleteForAlbum below.
export async function pushSharedGraphTitle(albumId, title) {
	const graphId = readSharedGraphIds()[albumId];
	if (!graphId) return;
	try {
		await fetch(`${API_BASE}/api/shared/${graphId}`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title }),
		});
	} catch (err) {
		console.error("Failed to push updated album title to shared graph:", err);
	}
}

// Permanently ends a share when the album backing it gets deleted locally -
// without this, deleting an album left its shared_graphs row orphaned
// server-side, so collaborators (and anyone with the public link) kept full
// access to a "deleted" album's last-synced snapshot forever. Reuses the
// exact server-side teardown the expiry sweep already performs (see
// runExpirySweep in server.js) and the exact client-side "graph-deleted"
// handling already built for it - just triggered on demand instead of after
// the idle-expiry grace period.
export async function revokeSharedGraphForAlbum(albumId) {
	const graphId = readSharedGraphIds()[albumId];
	if (!graphId) return;
	try {
		await fetch(`${API_BASE}/api/shared/${graphId}`, { method: "DELETE", credentials: "include" });
	} catch (err) {
		console.error("Failed to revoke shared graph before deleting album:", err);
	}
	const map = readSharedGraphIds();
	delete map[albumId];
	localStorage.setItem(SHARED_GRAPH_IDS_KEY, JSON.stringify(map));
}

// Per-graph opt-in for "should a browser-extension quick-add, while this
// shared graph is open, route into it (instead of the collaborator's own
// local history/album, which is what happens today)." Mirrors the
// rocus-shared-graph-ids map exactly: { [graphId]: true | false }. A graph
// with no entry here has never been asked yet - see
// maybeShowQuickAddRoutingPrompt() in useAIModels.js, which is what actually
// triggers the first-time popup.
const QUICKADD_ROUTING_KEY = "rocus-quickadd-routing";

function readQuickAddRouting() {
	try {
		return JSON.parse(localStorage.getItem(QUICKADD_ROUTING_KEY) || "{}");
	} catch {
		return {};
	}
}

export function quickAddRoutingChoice(graphId) {
	if (!graphId) return null;
	const map = readQuickAddRouting();
	return graphId in map ? map[graphId] : null;
}

export function setQuickAddRoutingChoice(graphId, enabled) {
	if (!graphId) return;
	const map = readQuickAddRouting();
	map[graphId] = !!enabled;
	localStorage.setItem(QUICKADD_ROUTING_KEY, JSON.stringify(map));
}

// A computed, not a ref+watcher - deliberately. This module and
// useGraphEngine.js (which owns remoteGraphId) import from each other; a
// watch(remoteGraphId, ...) registered at module top level would dereference
// that binding the instant this module's own body runs, which is exactly
// the pattern that caused a real, app-breaking circular-import crash
// earlier in this project (see initLocalOwnerSync()'s comment above for the
// full story). A computed's getter is lazy - it only runs when something
// actually reads .value, by which point every module has finished
// initializing - so it sidesteps the hazard entirely without needing a
// deferred-registration workaround like initLocalOwnerSync() needed.
const quickAddRoutingWriteTick = ref(0);
export const quickAddRoutesHere = computed(() => {
	quickAddRoutingWriteTick.value; // dependency: re-evaluate after setQuickAddRouting()
	const graphId = remoteGraphId.value || activeShareGraphId.value;
	if (!graphId) return false;

	const stored = quickAddRoutingChoice(graphId);
	if (stored !== null) return stored; // explicit choice always wins, either way

	// No explicit choice yet: default depends on whose graph this is. The
	// owner's own actively-shared album has always auto-routed quick-adds
	// (activeShareGraphId is only ever set for the owner's own local-owner
	// sync - never for a collaborator), so the default stays "route" there,
	// now just an explicit, visible, turn-off-able choice instead of
	// hardcoded. A collaborator's default stays "don't route" - never
	// silently redirect someone's bookmark into a graph they don't own
	// without asking first (see maybeShowQuickAddRoutingPrompt()).
	return !remoteGraphId.value || remoteGraphRole.value === "owner";
});

export function setQuickAddRouting(enabled) {
	const graphId = remoteGraphId.value || activeShareGraphId.value;
	setQuickAddRoutingChoice(graphId, enabled);
	quickAddRoutingWriteTick.value++;
}

// The one-time confirmation popup - "route new quick-adds into this shared
// graph?" Shown at most once per graph id (both a "no" and dismissing
// without choosing record a permanent "false" via setQuickAddRouting(false)
// in GraphNode.vue's dismiss handler, so this never nags twice for the same
// graph). Only relevant when SOMETHING is actually open to route into and
// nobody's answered yet for it.
export const showQuickAddRoutingPrompt = ref(false);

export function maybeShowQuickAddRoutingPrompt() {
	const graphId = remoteGraphId.value || activeShareGraphId.value;
	if (!graphId) return;
	if (quickAddRoutingChoice(graphId) !== null) return; // already asked
	showQuickAddRoutingPrompt.value = true;
}

// identityKey -> nodeId, "who is looking at what right now." Node-anchored
// rather than coordinate-anchored - see plan doc: D3 force simulations are
// non-deterministic per client, so a raw position means nothing on a
// collaborator's independently-laid-out copy of the same graph.
export const remoteCursors = ref({});

let socket = null;
let socketMode = "remote"; // 'remote' (a /shared/:graphId viewer) | 'local-owner' (the owner's own /dashboard)
let localOwnerSocketAlbumId = null;
let cursorThrottleAt = 0;

function wsBaseUrl() {
	if (API_BASE) return API_BASE.replace(/^http/, "ws");
	return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
}

function clusterRecordFromLocal(cluster) {
	return {
		id: cluster.id,
		topic: cluster.topic,
		websites: cluster.websites || [],
		similar_links: cluster.similar_links || {},
		manual_connections: cluster.manual_connections || [],
		album_id: cluster.album_id,
		is_notes_cluster: !!cluster.is_notes_cluster,
		notes_hub_links: cluster.notes_hub_links || [],
	};
}

function gatherAlbumNodes(albumId) {
	const nodes = [];
	const albumClusters = Object.values(clusters.value).filter((c) => c.album_id === albumId);

	for (const cluster of albumClusters) {
		nodes.push({ id: cluster.id, type: "cluster", data: clusterRecordFromLocal(cluster), addedBy: currentIdentityKey() });

		for (const websiteId of cluster.websites || []) {
			const website = websites.value[websiteId];
			if (!website) continue;
			nodes.push({
				id: websiteId,
				type: "website",
				data: { ...website, embedding: embeddings.value[websiteId] || null },
				addedBy: website.added_by || currentIdentityKey(),
			});
		}
	}

	return nodes;
}

// Whether the given album contains at least one uploaded-file website node -
// gates whether the share panel even asks about guest file-download
// permission at all ("if there are any," per the request). Mirrors
// gatherAlbumNodes()'s own traversal rather than reusing its output, since
// callers need this BEFORE sharing (to decide whether to show the
// checkbox), not just after.
export function albumHasFiles(albumId) {
	if (!albumId) return false;
	const albumClusters = Object.values(clusters.value).filter((c) => c.album_id === albumId);
	for (const cluster of albumClusters) {
		for (const websiteId of cluster.websites || []) {
			if (websites.value[websiteId]?.is_file) return true;
		}
	}
	return false;
}

// Same question, but resolved for whatever's actually about to be (or
// already is) shared, covering all three real cases the share panel can be
// open in:
//   - The owner's own /dashboard, an Album selected: check that album.
//   - The owner's own /dashboard, a History day selected (no album exists
//     yet until the first share creates one, per ensureShareableAlbumId()):
//     check that day's clusters directly.
//   - The owner reopening their own share link via /shared/:graphId
//     (remoteGraphId set): websites.value in this mode contains ONLY this
//     shared graph's own nodes (loadSharedGraphData() clears and repopulates
//     it fresh), so checking all of it is exactly correct here - no
//     over-inclusion risk from the user's other, unrelated albums.
export function shareTargetHasFiles() {
	if (remoteGraphId.value) {
		return Object.values(websites.value).some((w) => w?.is_file);
	}
	if (currentAlbum.value?.id) return albumHasFiles(currentAlbum.value.id);
	if (currentHistoryDay.value) {
		const dayClusters = Object.values(clusters.value).filter(
			(c) => getClusterDayKey(c) === currentHistoryDay.value
		);
		return dayClusters.some((cluster) =>
			(cluster.websites || []).some((id) => websites.value[id]?.is_file)
		);
	}
	return false;
}

// Sharing always operates on a materialized Album. If the user is currently
// in a History day-view instead (which has no ID/persisted record today), a
// real Album is created first from that day's clusters - not reinventing the
// Album/History asymmetry, just resolving it once at share time.
async function ensureShareableAlbumId() {
	if (currentAlbum.value?.id) return currentAlbum.value.id;

	if (currentHistoryDay.value) {
		const dayClusters = Object.values(clusters.value).filter(
			(c) => getClusterDayKey(c) === currentHistoryDay.value
		);

		const { album } = await createAlbum({ name: `Shared - ${currentHistoryDay.value}`, icon: iconOptions[0] });
		for (const cluster of dayClusters) {
			clusters.value[cluster.id].album_id = album.id;
		}
		await saveToIndexedDB();
		return album.id;
	}

	throw new Error("no_album_or_day_selected");
}

export async function shareCurrentGraph({ publicLinkEnabled = false, guestDownloadsEnabled = false } = {}) {
	shareBusy.value = true;
	shareError.value = "";
	try {
		const albumId = await ensureShareableAlbumId();
		const nodes = gatherAlbumNodes(albumId);

		const sharedGraphIds = readSharedGraphIds();
		const graphId = activeShareGraphId.value || sharedGraphIds[albumId] || generateId();

		const res = await fetch(`${API_BASE}/api/shared`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ graphId, nodes, publicLinkEnabled, guestDownloadsEnabled, title: albums.value[albumId]?.name || null }),
		});

		if (res.status === 401) {
			shareError.value = "Sign in to share a graph.";
			return null;
		}
		if (res.status === 403) {
			const body = await res.json().catch(() => ({}));
			if (body.code === "SHARE_GRAPH_CAP") {
				openPremiumModal("share_graph_cap");
				return null;
			}
		}
		if (!res.ok) throw new Error(`share_failed_${res.status}`);

		const data = await res.json();
		activeShareGraphId.value = graphId;
		activeShareUrl.value = data.url;
		sharePublicLinkEnabled.value = publicLinkEnabled;
		sharePublicLinkAllowsDownloads.value = guestDownloadsEnabled;
		isSharePanelOpen.value = true;
		rememberSharedGraphId(albumId, graphId);
		trackEvent('graph_shared', { public_link: publicLinkEnabled });

		await refreshShareMembers();
		// 'local-owner', not the default 'remote' mode - shareCurrentGraph() is
		// only ever called from the owner's own /dashboard (viewing a shared
		// graph via /shared/:graphId goes through openSharedGraph() instead), so
		// incoming pushes need to MERGE into the owner's local IndexedDB-backed
		// state, not wholesale-replace it the way a read-only remote view does.
		connectSharedGraphSocket(graphId, "local-owner");
		localOwnerSocketAlbumId = albumId;

		return data.url;
	} catch (err) {
		console.error("Failed to share graph:", err);
		// Specific, actionable message for the single most common failure
		// (clicking Share while on "All Clusters", which has no album/day to
		// materialize a graph from) - shown as a toast regardless of whether
		// the panel is even open, since previously this failure produced no
		// visible feedback at all.
		const message =
			err.message === "no_album_or_day_selected"
				? "Open a specific Album to share it - sharing isn't available from All Clusters."
				: "Couldn't share this graph. Try again.";
		shareError.value = message;
		flashShareToast(message, "error");
		return null;
	} finally {
		shareBusy.value = false;
	}
}

// Explicit, deliberate "share this graph" action - the in-panel button shown
// when nothing's been shared yet for the current album. Distinct from
// merely opening the panel (handleShareClick in GraphNode.vue), which no
// longer performs any server call on its own - see plan doc Bug C.
export async function confirmShare(options) {
	const url = await shareCurrentGraph(options);
	if (url) {
		flashShareToast(sharePublicLinkEnabled.value ? "Shared - anyone with the link can view" : "Graph shared");
	}
	return url;
}

// The explicit "Copy" button's own toast - matches "run the notifications
// when I click Copy or Share" exactly, as two distinct deliberate actions.
export function notifyLinkCopied() {
	flashShareToast("Link copied");
}

// Preemptive check for the same "All Clusters has nothing to share" failure,
// used by the header icon's click handler so it can show the error toast
// immediately instead of opening a panel that would have nothing useful to
// offer. shareCurrentGraph()'s own catch block still handles this too, as a
// second line of defense.
export function canShareCurrentSelection() {
	return !!(currentAlbum.value?.id || currentHistoryDay.value);
}

export async function inviteCollaborator(email, permissionLevel = "view") {
	if (!activeShareGraphId.value || !email?.trim()) return { success: false };

	const res = await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/invite`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: email.trim(), permissionLevel }),
	});
	const body = await res.json().catch(() => ({}));

	if (res.status === 403 && body.code === "SHARE_SEAT_CAP") {
		openPremiumModal("share_seat_cap");
		return { success: false, code: "SHARE_SEAT_CAP" };
	}
	if (!res.ok) {
		shareError.value = "Couldn't send that invite.";
		return { success: false };
	}

	await refreshShareMembers();
	trackEvent('collaborator_invited', { permission_level: permissionLevel });
	return { success: true };
}

export async function updateCollaboratorPermission(invitedEmail, { permissionLevel, canInvite } = {}) {
	if (!activeShareGraphId.value) return;
	await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/members/${encodeURIComponent(invitedEmail)}`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ permissionLevel, canInvite }),
	});
	await refreshShareMembers();
	trackEvent('collaborator_permission_changed', { permission_level: permissionLevel, can_invite: canInvite });
}

export async function revokeCollaborator(invitedEmail) {
	if (!activeShareGraphId.value) return;
	await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/members/${encodeURIComponent(invitedEmail)}`, {
		method: "DELETE",
		credentials: "include",
	});
	await refreshShareMembers();
	trackEvent('collaborator_revoked');
}

export async function togglePublicLink(enabled) {
	if (!activeShareGraphId.value) return;
	await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/public-link`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ enabled }),
	});
	sharePublicLinkEnabled.value = enabled;
	trackEvent('public_link_toggled', { enabled });
}

// Separate from togglePublicLink() - this is specifically the "can a guest
// via the public link download files" permission, always sent alongside
// (never instead of) the current public-link enabled state, since the
// backend route updates both columns in one request.
export async function toggleGuestDownloads(enabled) {
	if (!activeShareGraphId.value) return;
	await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/public-link`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ enabled: sharePublicLinkEnabled.value, guestDownloadsEnabled: enabled }),
	});
	sharePublicLinkAllowsDownloads.value = enabled;
	trackEvent('guest_downloads_toggled', { enabled });
}

export async function refreshShareMembers() {
	if (!activeShareGraphId.value) return;
	const res = await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}`, { credentials: "include" });
	if (!res.ok) return;
	const data = await res.json();
	shareMembers.value = data.members || [];
	sharePublicLinkEnabled.value = data.publicLinkEnabled;
	sharePublicLinkAllowsDownloads.value = !!data.guestDownloadsEnabled;
	shareOwnerName.value = data.ownerName || null;
	shareOwnerPictureUrl.value = data.ownerPictureUrl || null;
	shareOwnerIdentityKey.value = data.ownerIdentityKey || null;
}

export function closeSharePanel() {
	isSharePanelOpen.value = false;
}

// ---------------------------------------------------------------------------
// "Shared with me" / "Shared" dropdown sections. Powers navigation to
// graphs OTHER people have shared with you, and an at-a-glance list of your
// OWN albums that are currently actively shared. Fetched lazily (only when
// the dropdown is actually opened, matching the existing toggleUploadsPanel
// -> fetchUploadedFiles() pattern), not on every page load.
// ---------------------------------------------------------------------------

// { id, ownerName, ownerPictureUrl, permissionLevel, lastActivityAt }[] -
// graphs owned by someone ELSE that this identity has joined as a
// collaborator. Ready to render directly; there's no local data to
// cross-reference since none of this lives in this browser's own IndexedDB.
export const sharedWithMeGraphs = ref([]);

// Set of graph ids the server confirms are still actively owned+shared by
// this identity - used only to validate the local rocus-shared-graph-ids
// cache below, never rendered directly.
export const activelyOwnedSharedGraphIds = ref(new Set());

export async function fetchMySharedGraphs() {
	try {
		const res = await fetch(`${API_BASE}/api/shared`, { credentials: "include" });
		if (!res.ok) return;
		const data = await res.json();
		sharedWithMeGraphs.value = data.memberOf || [];
		activelyOwnedSharedGraphIds.value = new Set((data.owned || []).map((g) => g.id));
	} catch (err) {
		console.error("Failed to fetch my shared graphs:", err);
	}
}

// { album, graphId }[] - this identity's OWN albums that are currently
// actively shared. Built from the local rocus-shared-graph-ids map + the
// already-loaded albums.value (names/icons only ever live locally - the
// server has no "title" for a shared graph), filtered down to entries
// activelyOwnedSharedGraphIds confirms are still genuinely live server-side,
// so a stale local mapping (e.g. the graph since expired) never lingers
// here misleadingly.
export const myActivelySharedAlbums = computed(() => {
	const map = readSharedGraphIds();
	const result = [];
	for (const [albumId, graphId] of Object.entries(map)) {
		if (!activelyOwnedSharedGraphIds.value.has(graphId)) continue;
		const album = albums.value[albumId];
		if (!album) continue;
		result.push({ album, graphId });
	}
	return result;
});

// Called by the frontend right after a non-user finishes signup/login via an
// invite link (see router redirect flow) - resolves their now-known session
// onto the pending invited_email row.
export async function joinSharedGraph(graphId) {
	await fetch(`${API_BASE}/api/shared/${graphId}/join`, { method: "POST", credentials: "include" });
	trackEvent('shared_graph_joined');
}

// Pushes newly-added nodes (a website/note just processed) up to a shared
// graph, resolving the target graph one of two ways:
//   1. remoteGraphId.value - set while viewing /shared/:graphId (a
//      collaborator editing, or the owner reopening their own link).
//   2. albumId looked up in the local shared-graph-id map - the OWNER'S OWN
//      /dashboard, when the album this content just landed in happens to be
//      actively shared. This second path was missing entirely until this
//      audit pass: pushNodesToSharedGraph() used to check ONLY
//      remoteGraphId.value, which is never set on the owner's own dashboard
//      (only loadSharedGraphData(), i.e. the /shared/:graphId route, sets
//      it) - so an owner adding new content to their own shared album never
//      pushed it to the server at all. Only a collaborator's edits were
//      ever propagating; the owner's own never did.
// Fire-and-forget from the caller's perspective; the WS broadcast this
// triggers server-side is what other viewers react to.
export async function pushNodeUpdateForAlbum(albumId, nodes) {
	let graphId = null;

	if (remoteGraphId.value) {
		if (remoteGraphRole.value !== "owner" && remoteGraphRole.value !== "edit") return;
		graphId = remoteGraphId.value;
	} else if (albumId) {
		graphId = readSharedGraphIds()[albumId] || null;
	}

	if (!graphId) return;

	try {
		await fetch(`${API_BASE}/api/shared/${graphId}/nodes`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nodes }),
		});
	} catch (err) {
		console.error("Failed to push nodes to shared graph:", err);
	}
}

// Same resolution logic as pushNodeUpdateForAlbum above, for the delete side -
// a cluster/website removed locally (rename/remove-websites/delete-cluster in
// useClusterActions.js) needs the matching shared_graph_nodes row(s) removed
// too, or it silently reappears for every other collaborator on their next
// refetch (this was a real, reported bug: deleting a cluster while
// collaborating left it fully intact for everyone else).
export async function pushNodeDeleteForAlbum(albumId, nodeIds) {
	if (!Array.isArray(nodeIds) || nodeIds.length === 0) return;
	let graphId = null;

	if (remoteGraphId.value) {
		if (remoteGraphRole.value !== "owner" && remoteGraphRole.value !== "edit") return;
		graphId = remoteGraphId.value;
	} else if (albumId) {
		graphId = readSharedGraphIds()[albumId] || null;
	}

	if (!graphId) return;

	try {
		await fetch(`${API_BASE}/api/shared/${graphId}/nodes`, {
			method: "DELETE",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nodeIds }),
		});
	} catch (err) {
		console.error("Failed to push node deletion to shared graph:", err);
	}
}

// Loads a shared graph as the current view (guest, invited collaborator, or
// the owner reopening it) - the entry point the /shared/:graphId route calls.
export async function openSharedGraph(graphId) {
	disconnectSharedGraphSocket();
	sharedGraphLoadError.value = "";
	sharedGraphNeedsSignIn.value = false;
	try {
		const payload = await loadSharedGraphData(graphId, { API_BASE });
		shareMembers.value = payload.members || [];
		sharePublicLinkEnabled.value = payload.publicLinkEnabled;
		sharePublicLinkAllowsDownloads.value = !!payload.guestDownloadsEnabled;
		shareOwnerName.value = payload.ownerName || null;
		shareOwnerPictureUrl.value = payload.ownerPictureUrl || null;
		shareOwnerIdentityKey.value = payload.ownerIdentityKey || null;

		// Reset unconditionally BEFORE the owner-only branch below - matches
		// the same pattern leaveSharedGraph()/syncLocalOwnerSocketForAlbum()
		// already use, and for the same reason: several functions
		// (refreshShareMembers, inviteCollaborator, revokeCollaborator,
		// togglePublicLink, etc.) read activeShareGraphId alone with no
		// remoteGraphId fallback, so a stale value surviving from a
		// previously-loaded graph would make those act on the WRONG graph.
		// Not reachable via any button in the app today (every shared-graph
		// switch is a hard page navigation, which resets all this module's
		// state from scratch anyway) - cheap insurance the moment that
		// changes, same reasoning as App.vue's own :key comment.
		activeShareGraphId.value = null;
		activeShareUrl.value = null;

		// Without this, activeShareGraphId stays null whenever the owner opens
		// their own share link fresh (a full page load resets all in-memory
		// state) - clicking "Share" again would then think no graph exists yet
		// and mint a brand-new one instead of resuming this one. See
		// rememberSharedGraphId()'s comment for the full failure mode.
		if (payload.role === "owner") {
			activeShareGraphId.value = graphId;
			activeShareUrl.value = window.location.href;
		}

		if (!payload.frozen) connectSharedGraphSocket(graphId);
		trackEvent('shared_graph_opened', { role: payload.role });
		return payload;
	} catch (err) {
		sharedGraphNeedsSignIn.value = err?.message === "sign_in_required";
		sharedGraphLoadError.value =
			err?.message === "sign_in_required"
				? "Sign in to view this shared graph."
				: err?.message === "not_found"
					? "This shared graph isn't available - the link may be wrong, access may have been revoked, or the owner may have turned off sharing."
					: "Couldn't load this shared graph. Try again in a moment.";
		trackEvent('shared_graph_load_failed', { reason: err?.message || 'unknown' });
		throw err;
	}
}

export function leaveSharedGraph() {
	disconnectSharedGraphSocket();
	clearRemoteGraphState();
	activeShareGraphId.value = null;
	activeShareUrl.value = null;
	shareMembers.value = [];
	remoteCursors.value = {};
}

// mode 'remote': a /shared/:graphId viewer (guest/collaborator/owner
// reopening their own link) - nodes-updated wholesale-reloads via
// refreshRemoteGraph(), correct because that view's entire graphData/local
// refs ARE just this one shared graph's mirror.
//
// mode 'local-owner': the owner's own /dashboard, looking at an album they've
// shared. Their websites/clusters store holds far more than just this one
// album, so nodes-updated instead MERGES incoming nodes into the existing
// local state and persists via saveToIndexedDB() - see
// mergeRemoteNodesIntoLocalAlbum(). This is the fix for "a collaborator's
// edit didn't show up on the owner's page": previously no socket was ever
// opened for the owner's plain dashboard view at all.
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimer = null;
let reconnectAttempts = 0;
let intentionalDisconnect = false;

// Client-side half of the heartbeat fix (see server.js's own comment on its
// ping/pong sweep for the full failure mode this closes: a reverse proxy
// silently killing an idle connection without ever delivering a close frame,
// which the existing onclose-triggered reconnect logic above can never
// detect on its own). Browsers don't expose raw WS ping/pong frames to JS,
// so this tracks the last time ANY message arrived (including the server's
// app-level "heartbeat" broadcast) and, if too much time passes while
// readyState still claims OPEN, treats that as proof the connection is dead
// and force-closes it - the existing onclose handler takes it from there.
// A flat watchdog interval, not tied to connect/disconnect lifecycle,
// mirroring the module's existing style of persistent top-level state - it's
// a no-op whenever there's no live socket.
const WATCHDOG_INTERVAL_MS = 15000;
const STALE_CONNECTION_MS = 70000; // comfortably above the server's 25s heartbeat interval
let lastMessageAt = Date.now();
setInterval(() => {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	if (Date.now() - lastMessageAt > STALE_CONNECTION_MS) socket.close();
}, WATCHDOG_INTERVAL_MS);

function connectSharedGraphSocket(graphId, mode = "remote") {
	disconnectSharedGraphSocket();
	intentionalDisconnect = false;
	socketMode = mode;
	socket = new WebSocket(`${wsBaseUrl()}/ws/shared/${graphId}`);

	socket.onopen = () => {
		reconnectAttempts = 0; // a successful (re)connection resets the retry budget
		lastMessageAt = Date.now();

		// Back-fills anything pushed while this socket was down - the ORIGINAL
		// connect already gets a fresh full load from whatever called this
		// (loadSharedGraphData/catchUpSharedGraphNodes, both above this
		// function), but a RECONNECT previously just resumed listening for new
		// broadcasts with no way to know what it missed while dead. Both of
		// these are already-idempotent, already-proven functions - calling
		// them again here is harmless on the very first connect too, just a
		// redundant fetch.
		if (mode === "local-owner") {
			catchUpSharedGraphNodes(graphId);
		} else {
			refreshRemoteGraph(API_BASE);
		}
	};

	socket.onmessage = (event) => {
		let msg;
		try {
			msg = JSON.parse(event.data);
		} catch {
			return;
		}
		lastMessageAt = Date.now();

		switch (msg.type) {
			case "nodes-updated":
				if (socketMode === "local-owner") {
					mergeRemoteNodesIntoLocalAlbum(msg.nodes);
				} else {
					refreshRemoteGraph(API_BASE);
				}
				break;
			case "nodes-deleted":
				if (socketMode === "local-owner") {
					removeNodesFromLocalAlbum(msg.nodeIds);
				} else {
					// refreshRemoteGraph() does a full re-fetch + re-render, which
					// already correctly reflects a deletion (the removed node just
					// isn't in the response anymore) - no separate removal logic
					// needed for a remote/collaborator viewer.
					refreshRemoteGraph(API_BASE);
				}
				break;
			case "member-joined":
			case "permissions-changed":
				refreshShareMembers();
				break;
			case "member-revoked":
				// If it's THIS client being revoked, freeze what's currently in
				// memory into a local Album snapshot rather than just losing access
				// silently - matches the spec's "revoked collaborator keeps a local
				// snapshot, same as expiry" behavior. Only meaningful in 'remote'
				// mode - an owner can't be revoked from their own graph.
				if (socketMode === "remote" && msg.identityKey && msg.identityKey === currentIdentityKey()) {
					freezeSharedGraphToLocalAlbum("revoked");
				} else {
					refreshShareMembers();
				}
				break;
			case "graph-expired":
				if (socketMode === "remote") {
					remoteGraphFrozen.value = true;
					freezeSharedGraphToLocalAlbum("expired");
				} else {
					// The owner already has their own local copy by definition - no
					// freeze needed, just stop listening on a graph that no longer exists.
					disconnectSharedGraphSocket();
				}
				break;
			case "graph-deleted":
				// Only reachable if a socket reconnected during the expired->deleted
				// grace window (see runExpirySweep) - same handling as expiry, just
				// with its own wording since the graph is now gone for good rather
				// than just frozen-but-still-fetchable.
				if (socketMode === "remote") {
					remoteGraphFrozen.value = true;
					freezeSharedGraphToLocalAlbum("deleted");
				} else {
					disconnectSharedGraphSocket();
				}
				break;
			case "cursor":
				if (msg.identityKey) {
					remoteCursors.value = { ...remoteCursors.value, [msg.identityKey]: msg.nodeId };
				}
				break;
			case "presence":
				onlineIdentityKeys.value = new Set(msg.identityKeys || []);
				break;
			// "heartbeat" deliberately falls through to no case - the mere act
			// of receiving it already updated lastMessageAt above, which is its
			// entire purpose (see the watchdog's own comment).
		}
	};

	// Reconnect on an unexpected close - previously a dropped connection
	// (tab backgrounded and browsers throttling/suspending WebSocket
	// activity, a brief network blip) stayed dead until a full manual page
	// reload, silently missing anything pushed in the meantime (the
	// catch-up fetch above only runs once, on initial connect - it doesn't
	// help a connection that dies mid-session). Capped at
	// MAX_RECONNECT_ATTEMPTS so a genuinely dead end (the graph expired, or
	// this identity was revoked - the server will just reject the socket
	// again immediately) doesn't retry forever; a flat delay, not a full
	// backoff scheme, since this is closing an obvious gap, not building
	// general-purpose resilience infrastructure.
	socket.onclose = () => {
		socket = null;
		if (intentionalDisconnect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
		reconnectAttempts++;
		reconnectTimer = setTimeout(() => {
			if (!intentionalDisconnect) connectSharedGraphSocket(graphId, mode);
		}, RECONNECT_DELAY_MS);
	};
}

export function disconnectSharedGraphSocket() {
	intentionalDisconnect = true;
	clearTimeout(reconnectTimer);
	reconnectTimer = null;
	reconnectAttempts = 0;
	if (socket) {
		socket.onopen = null;
		socket.onmessage = null;
		socket.onclose = null;
		socket.close();
		socket = null;
	}
	remoteCursors.value = {};
	onlineIdentityKeys.value = new Set();
}

// Order-independent structural equality - a plain JSON.stringify comparison
// isn't safe here because the server round-trips node data through a
// Postgres JSONB column, which doesn't preserve original key order, so two
// semantically-identical objects can stringify differently and falsely look
// "changed" on every single catch-up fetch.
function deepEqual(a, b) {
	if (a === b) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	// Array-ness must match too - without this, a plain object and an array
	// sharing the same numeric-string keys/values would compare equal.
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	// Compare the actual key SET, not just the count - two same-size objects
	// with different key names (a swapped field) would otherwise slip
	// through as "equal" as long as every value happens to resolve to
	// undefined on the other side.
	return aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}

// Merges nodes a collaborator just pushed into the OWNER's real local
// IndexedDB-backed state - deliberately not a wholesale replace (that's what
// refreshRemoteGraph() does for a read-only remote view), since the owner's
// local websites/clusters store holds everything else in their library too,
// not just this one shared album.
async function mergeRemoteNodesIntoLocalAlbum(nodes) {
	if (!Array.isArray(nodes)) return;
	// Only persist+re-render when the merge actually changed something - this
	// runs on every album selection (see syncLocalOwnerSocketForAlbum below),
	// and the overwhelmingly common case is catching up on an album that has
	// no new remote content at all. refreshData() rebuilds every node's
	// position from scratch (processApiData() places them on a fresh circle),
	// so calling it unconditionally here caused a visible double-render flash
	// on top of selectAlbum()'s own render - once from local IndexedDB data,
	// then immediately again from this catch-up fetch finding nothing new.
	let changed = false;
	for (const node of nodes) {
		if (!node?.id || !node?.type) continue;
		if (node.type === "website") {
			const { embedding, ...websiteFields } = node.data || {};
			// Force album_id to the OWNER's own local album for THIS graph,
			// not whatever value (often null) the pushing collaborator's
			// client happened to stamp on it. A collaborator who hasn't
			// opted into "route quick-adds into this shared graph"
			// (quickAddRoutesHere defaults to false for them) still has
			// their edits pushed into the graph they're actively viewing -
			// but with album_id: null, since their own remote view never
			// filters by album at all and has no reason to set it correctly.
			// The OWNER's dashboard, unlike a remote view, DOES filter
			// fetchClusters()/websites by exact album_id match - without
			// this override, a real content-loss bug: the collaborator's
			// addition was correctly pushed, correctly received over the
			// live socket, and correctly saved to IndexedDB, but silently
			// never rendered because its album_id didn't match the
			// currently-selected album. Confirmed live: WS frame arrived
			// with the right data, IndexedDB had it, only the album filter
			// was hiding it.
			if (localOwnerSocketAlbumId) websiteFields.album_id = localOwnerSocketAlbumId;
			if (!deepEqual(websites.value[node.id], websiteFields)) {
				websites.value[node.id] = websiteFields;
				changed = true;
			}
			if (embedding) embeddings.value[node.id] = embedding;
		} else if (node.type === "cluster") {
			const clusterData = localOwnerSocketAlbumId
				? { ...node.data, album_id: localOwnerSocketAlbumId }
				: node.data;
			if (!deepEqual(clusters.value[node.id], clusterData)) {
				clusters.value[node.id] = clusterData;
				changed = true;
			}
		}
	}
	if (!changed) return;
	await saveToIndexedDB();
	await refreshData();
}

// The delete-side counterpart to mergeRemoteNodesIntoLocalAlbum above - a
// collaborator deleting a cluster/website needs the OWNER's own local
// IndexedDB copy to drop it too, not just the server's shared_graph_nodes row
// (which pushNodeDeleteForAlbum/the DELETE route already handle).
async function removeNodesFromLocalAlbum(nodeIds) {
	if (!Array.isArray(nodeIds) || nodeIds.length === 0) return;
	let changed = false;
	for (const nodeId of nodeIds) {
		if (clusters.value[nodeId]) {
			delete clusters.value[nodeId];
			changed = true;
		}
		if (websites.value[nodeId]) {
			delete websites.value[nodeId];
			delete embeddings.value[nodeId];
			changed = true;
		}
		// A website id can still be referenced from a cluster's own websites
		// array even after the two checks above (e.g. it was only removed
		// from ONE cluster locally, or this ID was never this browser's own
		// top-level record to begin with) - strip it everywhere it's listed.
		for (const cluster of Object.values(clusters.value)) {
			const idx = cluster.websites?.indexOf(nodeId);
			if (idx > -1) {
				cluster.websites.splice(idx, 1);
				changed = true;
			}
		}
	}
	if (!changed) return;
	await saveToIndexedDB();
	await refreshData();
}

// Keeps the owner's dashboard live-connected to whichever shared graph
// corresponds to the currently-selected album, if any - without this, the
// only way to get a 'local-owner' socket was shareCurrentGraph() itself,
// which only runs in the exact session where you click Share. Reopen the
// browser, pick a previously-shared album, and there was never a
// reconnection at all.
function syncLocalOwnerSocketForAlbum(album) {
	const albumId = album?.id || null;
	if (albumId === localOwnerSocketAlbumId) return;

	if (socketMode === "local-owner") disconnectSharedGraphSocket();
	localOwnerSocketAlbumId = null;

	// Reset unconditionally, BEFORE either early return below - previously
	// these only ever got set (never cleared), so switching from a shared
	// album to an unshared one (or to History/"All Clusters") left the
	// previous album's graph id sitting here. That's not just why the
	// "Shared with..." badge stuck around everywhere (isCurrentGraphShared
	// just checks !!activeShareGraphId.value) - shareCurrentGraph() also
	// uses this exact value to decide which graph a re-share targets, so a
	// stale id here could silently write a second, different album's
	// content into the FIRST album's shared graph on the server.
	activeShareGraphId.value = null;
	activeShareUrl.value = null;
	shareMembers.value = [];

	if (!albumId) return;
	const graphId = readSharedGraphIds()[albumId];
	if (!graphId) return;

	localOwnerSocketAlbumId = albumId;
	activeShareGraphId.value = graphId;
	activeShareUrl.value = `${window.location.origin}/shared/${graphId}`;
	refreshShareMembers();
	catchUpSharedGraphNodes(graphId);
	connectSharedGraphSocket(graphId, "local-owner");
}

// Pulls the graph's FULL current node list from the server and merges it in
// - not just the delta a live broadcast would carry. Without this, the only
// way anything ever reached the owner's local state was a live broadcast
// landing at the exact moment their socket happened to be connected: a
// network blip, the tab being backgrounded (browsers throttle/suspend
// background WebSocket activity), a page load completing a beat after a
// collaborator's push, or the collaborator pushing before the owner's own
// connection finished its handshake, all silently and PERMANENTLY lost that
// content - nothing anywhere ever re-fetched it, not on reconnect, not on
// a full page reload (re-selecting the same album is a no-op per the early
// return above). Reuses mergeRemoteNodesIntoLocalAlbum()'s own per-node
// upsert logic - the GET /api/shared/:graphId response's nodes array is the
// same {id, type, data} shape a WS broadcast carries, just the whole graph's
// worth instead of one push's worth.
export async function catchUpSharedGraphNodes(graphId) {
	try {
		const res = await fetch(`${API_BASE}/api/shared/${graphId}`, { credentials: "include" });
		if (!res.ok) return;
		const payload = await res.json();
		await mergeRemoteNodesIntoLocalAlbum(payload.nodes);
	} catch (err) {
		console.error("Failed to catch up on shared graph nodes:", err);
	}
}

let localOwnerWatchStarted = false;

// Called from GraphNode.vue's onMounted (local/dashboard branch only), NOT
// registered at module top level. This module and useGraphEngine.js import
// from each other - a normally-safe circular pair, since every other
// cross-reference between them only happens inside function bodies. A
// top-level `watch(currentAlbum, ...)` call would need to dereference the
// `currentAlbum` binding the instant this module's own body runs - and
// tracing the actual chain (useGraphEngine -> useNotes -> useAIModels ->
// useSharing -> back to useGraphEngine, still mid-evaluation) confirmed,
// by actually loading the app in a browser and watching it fail to render
// at all, that useGraphEngine.js has not always finished initializing
// `currentAlbum` in its own scope by that point ("Cannot access
// 'currentAlbum' before initialization" - a real, app-breaking crash, not a
// hypothetical). Deferring both the watch() registration AND the initial
// check to a function called well after mount (long after every module has
// finished evaluating) sidesteps this entirely.
export function initLocalOwnerSync() {
	if (!localOwnerWatchStarted) {
		localOwnerWatchStarted = true;
		watch(currentAlbum, syncLocalOwnerSocketForAlbum);
	}
	syncLocalOwnerSocketForAlbum(currentAlbum.value);
}

// Sent whenever the local user's selection/hover moves to a different node
// while viewing a shared graph, throttled to avoid flooding the socket.
export function sendCursorUpdate(nodeId) {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	const now = Date.now();
	if (now - cursorThrottleAt < 150) return;
	cursorThrottleAt = now;
	socket.send(JSON.stringify({ type: "cursor", nodeId }));
}

// Copies whatever is currently loaded from a shared graph into a brand-new
// local Album in this browser's own IndexedDB - the shared building block
// behind both the expiry/revoke freeze and the guest "fork" CTA.
async function copyLoadedGraphIntoNewLocalAlbum(name) {
	const { album } = await createAlbum({ name, icon: iconOptions[0] });
	for (const cluster of Object.values(clusters.value)) {
		clusters.value[cluster.id] = { ...cluster, album_id: album.id };
	}
	await saveToIndexedDB();
	return album;
}

// Freezes whatever is currently loaded (from the last successful sync) into
// a brand-new local Album, exactly like the spec describes for both expiry
// and revoke - "Add to Albums" was a live subscription while shared; once
// access ends, it becomes a static local copy with all attributions intact.
async function freezeSharedGraphToLocalAlbum(reason) {
	disconnectSharedGraphSocket();
	await copyLoadedGraphIntoNewLocalAlbum("Shared graph (frozen copy)");
	clearRemoteGraphState();
	// Without this, the view silently swaps to an unrelated new local album
	// with zero explanation - remoteGraphFrozen/remoteGraphId both just got
	// reset above by clearRemoteGraphState(), so nothing else on screen
	// tells the viewer their live shared session just ended mid-visit.
	flashShareToast(
		reason === "revoked"
			? "Your access to this shared graph was revoked - saved a local copy for you."
			: reason === "deleted"
			? "This shared graph was permanently deleted - saved a local copy for you."
			: "This shared graph expired - saved a local copy for you.",
		"error"
	);
}

// The primary viral surface's conversion action: a guest viewing a public
// link copies the graph into their own local Rocus. Gated on being signed in
// first - per the spec, viewing is always free/frictionless, but the next
// action (fork/comment/edit) is where signup gets asked for.
export async function forkSharedGraph() {
	if (!store.user) {
		window.location.href = signInUrl();
		return null;
	}
	const album = await copyLoadedGraphIntoNewLocalAlbum("Forked shared graph");
	leaveSharedGraph();
	trackEvent('shared_graph_forked');
	return album.id;
}

// Node-anchored cursor badges are a rendering side effect, not graphData
// itself - re-drawn directly whenever the cursor map changes rather than
// waiting for the next full renderGraph() pass.
watch(remoteCursors, (cursors) => renderRemoteCursors(cursors));
