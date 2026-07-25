import { ref, computed } from "vue";
import { useAnalytics } from "../useAnalytics";
import {
	contextCluster,
	showContextMenu,
	showWebsiteContextMenu,
	websiteContextNode,
	clusters,
	websites,
	embeddings,
	rawSimilarities,
	saveToIndexedDB,
	refreshData,
} from "./useGraphEngine";

// Cluster/website context-menu actions: rename, add/remove websites,
// manual connections, add-to-album, delete cluster, edit website title.
// One-directional dependency on useGraphEngine (reads/writes its refs and
// calls its persistence/refresh helpers) - useGraphEngine never reads
// anything from this file, so it's fully acyclic.

const { trackEvent } = useAnalytics();

// ---- Rename cluster ------------------------------------------------------
export const showRenameModal = ref(false);
export const renameInput = ref('');

export function renameCluster() {
	renameInput.value = contextCluster.value.topic;
	showRenameModal.value = true;
	showContextMenu.value = false;
}

export function closeRenameModal() {
	showRenameModal.value = false;
	renameInput.value = '';
}

export async function confirmRename() {
	if (!renameInput.value.trim() || !contextCluster.value) return;

	try {
		const clusterId = contextCluster.value.id;
		clusters.value[clusterId].topic = renameInput.value.trim();

		await saveToIndexedDB();
		await refreshData();

		closeRenameModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error renaming cluster:', error);
		alert('Failed to rename cluster');
	}
}

// ---- Add websites to cluster ---------------------------------------------
export const showAddWebsites = ref(false);
export const selectedWebsitesToAdd = ref([]);

export const availableWebsites = computed(() => {
	if (!contextCluster.value) return [];

	const currentAlbumId = contextCluster.value.album_id;
	const clusterWebsiteIds = new Set(contextCluster.value.websites);

	return Object.values(websites.value).filter(website =>
		website.album_id === currentAlbumId && !clusterWebsiteIds.has(website.id)
	);
});

export function showAddWebsitesModal() {
	selectedWebsitesToAdd.value = [];
	showAddWebsites.value = true;
	showContextMenu.value = false;
}

export function closeAddWebsitesModal() {
	showAddWebsites.value = false;
	selectedWebsitesToAdd.value = [];
}

export function toggleWebsiteSelection(websiteId) {
	const index = selectedWebsitesToAdd.value.indexOf(websiteId);
	if (index > -1) {
		selectedWebsitesToAdd.value.splice(index, 1);
	} else {
		selectedWebsitesToAdd.value.push(websiteId);
	}
}

export async function confirmAddWebsites() {
	if (!contextCluster.value || selectedWebsitesToAdd.value.length === 0) return;

	try {
		const clusterId = contextCluster.value.id;

		for (const websiteId of selectedWebsitesToAdd.value) {
			if (!clusters.value[clusterId].websites.includes(websiteId)) {
				clusters.value[clusterId].websites.push(websiteId);
				websites.value[websiteId].cluster_id = clusterId;
			}
		}

		await saveToIndexedDB();
		await refreshData();

		closeAddWebsitesModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding websites:', error);
		alert('Failed to add websites');
	}
}

// ---- Remove websites from cluster -----------------------------------------
export const showRemoveWebsites = ref(false);
export const selectedWebsitesToRemove = ref([]);

export function showRemoveWebsitesModal() {
	selectedWebsitesToRemove.value = [];
	showRemoveWebsites.value = true;
	showContextMenu.value = false;
}

export function closeRemoveWebsitesModal() {
	showRemoveWebsites.value = false;
	selectedWebsitesToRemove.value = [];
}

export function toggleRemoveSelection(websiteId) {
	const index = selectedWebsitesToRemove.value.indexOf(websiteId);
	if (index > -1) {
		selectedWebsitesToRemove.value.splice(index, 1);
	} else {
		selectedWebsitesToRemove.value.push(websiteId);
	}
}

export async function confirmRemoveWebsites(deleteEntirely = false) {
	if (!contextCluster.value || selectedWebsitesToRemove.value.length === 0) return;

	const action = deleteEntirely ? 'delete' : 'remove';
	const confirmed = confirm(
		`Are you sure you want to ${action} ${selectedWebsitesToRemove.value.length} website(s)? ${deleteEntirely ? 'This will permanently delete them.' : 'They will be removed from this cluster only.'
		}`
	);

	if (!confirmed) return;

	try {
		const clusterId = contextCluster.value.id;

		for (const websiteId of selectedWebsitesToRemove.value) {
			const index = clusters.value[clusterId].websites.indexOf(websiteId);
			if (index > -1) {
				clusters.value[clusterId].websites.splice(index, 1);
			}

			if (deleteEntirely) {
				// Delete website entirely from all clusters and embeddings
				delete websites.value[websiteId];
				delete embeddings.value[websiteId];

				// Remove from other clusters too
				for (const cluster of Object.values(clusters.value)) {
					const idx = cluster.websites.indexOf(websiteId);
					if (idx > -1) {
						cluster.websites.splice(idx, 1);
					}
				}
			} else {
				// Just remove cluster reference
				if (websites.value[websiteId]) {
					delete websites.value[websiteId].cluster_id;
				}
			}
		}

		// Delete cluster if empty
		if (clusters.value[clusterId].websites.length === 0) {
			delete clusters.value[clusterId];
		}

		await saveToIndexedDB();
		await refreshData();

		closeRemoveWebsitesModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error removing websites:', error);
		alert('Failed to remove websites');
	}
}

// ---- Delete cluster ---------------------------------------------------
export const showDeleteClusterModal = ref(false);

export function deleteCluster() {
	if (!contextCluster.value) return;
	showDeleteClusterModal.value = true;
	showContextMenu.value = false;
}

export function closeDeleteClusterModal() {
	showDeleteClusterModal.value = false;
}

// deleteWebsitesToo=false: ungroup the websites (drop cluster_id) and keep
// them, matching the old always-on behavior. deleteWebsitesToo=true: delete
// the websites entirely too, mirroring confirmRemoveWebsites' deleteEntirely path.
export async function confirmDeleteCluster(deleteWebsitesToo = false) {
	if (!contextCluster.value) return;

	try {
		const clusterId = contextCluster.value.id;
		const websiteIds = [...clusters.value[clusterId].websites];

		for (const websiteId of websiteIds) {
			if (deleteWebsitesToo) {
				delete websites.value[websiteId];
				delete embeddings.value[websiteId];

				// Remove from other clusters too, in case a website is
				// referenced from more than one cluster's website list.
				for (const cluster of Object.values(clusters.value)) {
					const idx = cluster.websites.indexOf(websiteId);
					if (idx > -1) {
						cluster.websites.splice(idx, 1);
					}
				}
			} else if (websites.value[websiteId]) {
				delete websites.value[websiteId].cluster_id;
			}
		}

		delete clusters.value[clusterId];

		await saveToIndexedDB();
		await refreshData();

		showDeleteClusterModal.value = false;
		contextCluster.value = null;
	} catch (error) {
		console.error('Error deleting cluster:', error);
		alert('Failed to delete cluster');
	}
}

// ---- Add cluster to album -----------------------------------------------
export const showAddToAlbumModal = ref(false);
export const selectedAlbumForCluster = ref(null);

export function showAddToAlbumModalFunction() {
	selectedAlbumForCluster.value = contextCluster.value?.album_id || null;
	showAddToAlbumModal.value = true;
	showContextMenu.value = false;
}

export function closeAddToAlbumModal() {
	showAddToAlbumModal.value = false;
	selectedAlbumForCluster.value = null;
}

export async function confirmAddToAlbum() {
	if (!contextCluster.value || !selectedAlbumForCluster.value) return;

	try {
		const clusterId = contextCluster.value.id;
		const albumId = selectedAlbumForCluster.value;

		// Update cluster's album_id
		clusters.value[clusterId].album_id = albumId;

		// Update all websites in this cluster
		for (const websiteId of clusters.value[clusterId].websites) {
			if (websites.value[websiteId]) {
				websites.value[websiteId].album_id = albumId;
			}
		}

		await saveToIndexedDB();
		await refreshData();

		closeAddToAlbumModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding cluster to album:', error);
		alert('Failed to add cluster to album');
	}
}

// ---- Manual connections ---------------------------------------------------
export const showAddConnection = ref(false);
export const showRemoveConnection = ref(false);
export const selectedConnectionCluster = ref(null);
export const selectedConnectionToRemove = ref(null);
export const connectionSearchTerm = ref('');

export const availableClustersForConnection = computed(() => {
	if (!contextCluster.value) return [];

	const currentClusterId = contextCluster.value.id;
	const currentAlbumId = contextCluster.value.album_id;

	// Get all clusters in the same album
	let available = Object.values(clusters.value).filter(cluster =>
		cluster.id !== currentClusterId &&
		cluster.album_id === currentAlbumId
	);

	// Filter by search term
	if (connectionSearchTerm.value) {
		const term = connectionSearchTerm.value.toLowerCase();
		available = available.filter(cluster =>
			cluster.topic?.toLowerCase().includes(term)
		);
	}

	return available;
});

// Computed for connected clusters
export const connectedClusters = computed(() => {
	if (!contextCluster.value) return [];

	const currentClusterId = contextCluster.value.id;
	const connections = [];

	// Find all manual connections
	if (clusters.value[currentClusterId]?.manual_connections) {
		const manualConnections = clusters.value[currentClusterId].manual_connections;
		for (const targetId of manualConnections) {
			const targetCluster = clusters.value[targetId];
			if (targetCluster) {
				connections.push({
					id: targetId,
					topic: targetCluster.topic,
					similarity: 8.0 // Manual connections shown as 100%
				});
			}
		}
	}

	// Find existing similarity-based connections
	if (rawSimilarities[currentClusterId]) {
		Object.entries(rawSimilarities[currentClusterId]).forEach(([targetId, similarity]) => {
			if (!connections.find(c => c.id === targetId)) {
				const targetCluster = clusters.value[targetId];
				if (targetCluster) {
					connections.push({
						id: targetId,
						topic: targetCluster.topic,
						similarity: similarity
					});
				}
			}
		});
	}

	return connections;
});

export function showAddConnectionModal() {
	showAddConnection.value = true;
	selectedConnectionCluster.value = null;
	connectionSearchTerm.value = '';
	showContextMenu.value = false;
}

export function closeAddConnectionModal() {
	showAddConnection.value = false;
	selectedConnectionCluster.value = null;
	connectionSearchTerm.value = '';
}

export function showRemoveConnectionModal() {
	showRemoveConnection.value = true;
	selectedConnectionToRemove.value = null;
	showContextMenu.value = false;
}

export function closeRemoveConnectionModal() {
	showRemoveConnection.value = false;
	selectedConnectionToRemove.value = null;
}

export async function confirmAddConnection() {
	if (!contextCluster.value || !selectedConnectionCluster.value) return;

	try {
		const sourceId = contextCluster.value.id;
		const targetId = selectedConnectionCluster.value;

		trackEvent('manual_connection_added');

		// Initialize manual_connections if not exists
		if (!clusters.value[sourceId].manual_connections) {
			clusters.value[sourceId].manual_connections = [];
		}

		// Add bidirectional connection
		if (!clusters.value[sourceId].manual_connections.includes(targetId)) {
			clusters.value[sourceId].manual_connections.push(targetId);
		}

		if (!clusters.value[targetId].manual_connections) {
			clusters.value[targetId].manual_connections = [];
		}

		if (!clusters.value[targetId].manual_connections.includes(sourceId)) {
			clusters.value[targetId].manual_connections.push(sourceId);
		}

		// Add to similarities for rendering
		if (!rawSimilarities[sourceId]) {
			rawSimilarities[sourceId] = {};
		}
		rawSimilarities[sourceId][targetId] = 1.0; // Manual connections = 100% similarity

		if (!rawSimilarities[targetId]) {
			rawSimilarities[targetId] = {};
		}
		rawSimilarities[targetId][sourceId] = 1.0;

		await saveToIndexedDB();
		await refreshData();

		closeAddConnectionModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error adding connection:', error);
		alert('Failed to add connection');
	}
}

export async function confirmRemoveConnection() {
	if (!contextCluster.value || !selectedConnectionToRemove.value) return;

	try {
		const sourceId = contextCluster.value.id;
		const targetId = selectedConnectionToRemove.value;

		// Remove from manual connections
		if (clusters.value[sourceId]?.manual_connections) {
			const index = clusters.value[sourceId].manual_connections.indexOf(targetId);
			if (index > -1) {
				clusters.value[sourceId].manual_connections.splice(index, 1);
			}
		}

		if (clusters.value[targetId]?.manual_connections) {
			const index = clusters.value[targetId].manual_connections.indexOf(sourceId);
			if (index > -1) {
				clusters.value[targetId].manual_connections.splice(index, 1);
			}
		}

		// Remove from similarities
		if (rawSimilarities[sourceId]?.[targetId]) {
			delete rawSimilarities[sourceId][targetId];
		}

		if (rawSimilarities[targetId]?.[sourceId]) {
			delete rawSimilarities[targetId][sourceId];
		}

		await saveToIndexedDB();
		await refreshData();

		closeRemoveConnectionModal();
		contextCluster.value = null;
	} catch (error) {
		console.error('Error removing connection:', error);
		alert('Failed to remove connection');
	}
}

// ---- Edit website title (from website node context menu) ------------------
export const showWebsiteEditModal = ref(false);
export const websiteTitleInput = ref('');

export function editWebsiteTitle() {
	if (!websiteContextNode.value) return;
	websiteTitleInput.value = websiteContextNode.value.title;
	showWebsiteEditModal.value = true;
	showWebsiteContextMenu.value = false;
}

export function closeWebsiteEditModal() {
	showWebsiteEditModal.value = false;
	websiteTitleInput.value = '';
	websiteContextNode.value = null;
}

export async function confirmWebsiteEdit() {
	if (!websiteTitleInput.value.trim() || !websiteContextNode.value) return;
	const websiteId = websiteContextNode.value.websiteId;
	const newTitle = websiteTitleInput.value.trim();
	if (websites.value[websiteId]) {
		websites.value[websiteId].title = newTitle;
		await saveToIndexedDB();
		await refreshData();
	}
	closeWebsiteEditModal();
}
