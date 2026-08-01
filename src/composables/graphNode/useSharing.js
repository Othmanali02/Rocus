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
	loadSharedGraphData,
	refreshRemoteGraph,
	refreshData,
	clearRemoteGraphState,
	renderRemoteCursors,
} from "./useGraphEngine";
import { createAlbum, iconOptions } from "./useAlbums";
import { generateId, currentIdentityKey } from "./utils";
import { API_BASE } from "../../components/constants/config";
import { openPremiumModal, signInUrl } from "./usePremium";
import { store } from "../../router/store";

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
export const activeShareGraphId = ref(null);
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
export const shareBusy = ref(false);
export const shareError = ref("");

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

const SHARED_GRAPH_IDS_KEY = "rocus-shared-graph-ids";

// Maps albumId -> the graphId it was last shared as, persisted across page
// refreshes. Without this, activeShareGraphId (in-memory only) resets to
// null on every reload, so clicking "Share" again on the same album would
// silently mint a brand-new shared_graphs row instead of resuming the one
// collaborators already have a link to - any permission change made in a
// since-refreshed session would appear to "not stick" because it was really
// being read back from a completely different graph.
function readSharedGraphIds() {
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
	return quickAddRoutingChoice(graphId) === true;
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
		if (dayClusters.length === 0) throw new Error("nothing_to_share");

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
		if (nodes.length === 0) throw new Error("nothing_to_share");

		const sharedGraphIds = readSharedGraphIds();
		const graphId = activeShareGraphId.value || sharedGraphIds[albumId] || generateId();

		const res = await fetch(`${API_BASE}/api/shared`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ graphId, nodes, publicLinkEnabled, guestDownloadsEnabled }),
		});

		if (res.status === 401) {
			shareError.value = "Sign in to share a graph.";
			return null;
		}
		if (!res.ok) throw new Error(`share_failed_${res.status}`);

		const data = await res.json();
		activeShareGraphId.value = graphId;
		activeShareUrl.value = data.url;
		sharePublicLinkEnabled.value = publicLinkEnabled;
		sharePublicLinkAllowsDownloads.value = guestDownloadsEnabled;
		isSharePanelOpen.value = true;
		rememberSharedGraphId(albumId, graphId);

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
		openPremiumModal();
		return { success: false, code: "SHARE_SEAT_CAP" };
	}
	if (!res.ok) {
		shareError.value = "Couldn't send that invite.";
		return { success: false };
	}

	await refreshShareMembers();
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
}

export async function revokeCollaborator(invitedEmail) {
	if (!activeShareGraphId.value) return;
	await fetch(`${API_BASE}/api/shared/${activeShareGraphId.value}/members/${encodeURIComponent(invitedEmail)}`, {
		method: "DELETE",
		credentials: "include",
	});
	await refreshShareMembers();
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
}

export function closeSharePanel() {
	isSharePanelOpen.value = false;
}

// Called by the frontend right after a non-user finishes signup/login via an
// invite link (see router redirect flow) - resolves their now-known session
// onto the pending invited_email row.
export async function joinSharedGraph(graphId) {
	await fetch(`${API_BASE}/api/shared/${graphId}/join`, { method: "POST", credentials: "include" });
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

// Loads a shared graph as the current view (guest, invited collaborator, or
// the owner reopening it) - the entry point the /shared/:graphId route calls.
export async function openSharedGraph(graphId) {
	disconnectSharedGraphSocket();
	sharedGraphLoadError.value = "";
	try {
		const payload = await loadSharedGraphData(graphId, { API_BASE });
		shareMembers.value = payload.members || [];
		sharePublicLinkEnabled.value = payload.publicLinkEnabled;
		sharePublicLinkAllowsDownloads.value = !!payload.guestDownloadsEnabled;
		shareOwnerName.value = payload.ownerName || null;
		shareOwnerPictureUrl.value = payload.ownerPictureUrl || null;

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
		return payload;
	} catch (err) {
		sharedGraphLoadError.value =
			err?.message === "not_found"
				? "This shared graph isn't available - the link may be wrong, access may have been revoked, or the owner may have turned off sharing."
				: "Couldn't load this shared graph. Try again in a moment.";
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
function connectSharedGraphSocket(graphId, mode = "remote") {
	disconnectSharedGraphSocket();
	socketMode = mode;
	socket = new WebSocket(`${wsBaseUrl()}/ws/shared/${graphId}`);

	socket.onmessage = (event) => {
		let msg;
		try {
			msg = JSON.parse(event.data);
		} catch {
			return;
		}

		switch (msg.type) {
			case "nodes-updated":
				if (socketMode === "local-owner") {
					mergeRemoteNodesIntoLocalAlbum(msg.nodes);
				} else {
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
					freezeSharedGraphToLocalAlbum();
				} else {
					refreshShareMembers();
				}
				break;
			case "graph-expired":
				if (socketMode === "remote") {
					remoteGraphFrozen.value = true;
					freezeSharedGraphToLocalAlbum();
				} else {
					// The owner already has their own local copy by definition - no
					// freeze needed, just stop listening on a graph that no longer exists.
					disconnectSharedGraphSocket();
				}
				break;
			case "cursor":
				if (msg.identityKey) {
					remoteCursors.value = { ...remoteCursors.value, [msg.identityKey]: msg.nodeId };
				}
				break;
		}
	};

	socket.onclose = () => {
		socket = null;
	};
}

function disconnectSharedGraphSocket() {
	if (socket) {
		socket.onmessage = null;
		socket.onclose = null;
		socket.close();
		socket = null;
	}
	remoteCursors.value = {};
}

// Merges nodes a collaborator just pushed into the OWNER's real local
// IndexedDB-backed state - deliberately not a wholesale replace (that's what
// refreshRemoteGraph() does for a read-only remote view), since the owner's
// local websites/clusters store holds everything else in their library too,
// not just this one shared album.
async function mergeRemoteNodesIntoLocalAlbum(nodes) {
	if (!Array.isArray(nodes)) return;
	for (const node of nodes) {
		if (!node?.id || !node?.type) continue;
		if (node.type === "website") {
			const { embedding, ...websiteFields } = node.data || {};
			websites.value[node.id] = websiteFields;
			if (embedding) embeddings.value[node.id] = embedding;
		} else if (node.type === "cluster") {
			clusters.value[node.id] = node.data;
		}
	}
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
	connectSharedGraphSocket(graphId, "local-owner");
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
async function freezeSharedGraphToLocalAlbum() {
	disconnectSharedGraphSocket();
	await copyLoadedGraphIntoNewLocalAlbum("Shared graph (frozen copy)");
	clearRemoteGraphState();
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
	return album.id;
}

// Node-anchored cursor badges are a rendering side effect, not graphData
// itself - re-drawn directly whenever the cursor map changes rather than
// waiting for the next full renderGraph() pass.
watch(remoteCursors, (cursors) => renderRemoteCursors(cursors));
