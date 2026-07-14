import { ref, reactive } from "vue";
import { db } from "./useDatabase";
import { generateId } from "./utils";
import { useAnalytics } from "../useAnalytics";
import {
	currentAlbum,
	simulation,
	graphData,
	loadData,
	renderGraph,
} from "./useGraphEngine";

// Album CRUD + the album switcher dropdown. Albums live in their own
// IndexedDB store (independent of the websites/clusters/embeddings store
// useGraphEngine persists), so this file only ever reads from
// useGraphEngine - never the other way around.

const { trackEvent } = useAnalytics();

export const albums = ref([]);
export const showAlbumsDropdown = ref(false);
export const showAlbumModal = ref(false);
export const editingAlbum = ref(null);
export const albumForm = reactive({
	name: "",
	icon: "RocusFileIcon.png",
});

export const iconOptions = [
	"RocusFileIcon.png",
	"RocusFileIconColored.png",
	"RocusFileIconDark.png",
];

export const iconUrls = iconOptions.map(
	(icon) => new URL(`../../components/images/${icon}`, import.meta.url).href
);

export function getIconUrl(iconFileName) {
	if (!iconFileName) return '';
	if (iconFileName.startsWith('http') || iconFileName.startsWith('data:')) {
		return iconFileName;
	}
	return new URL(`../../components/images/${iconFileName}`, import.meta.url).href;
}

export async function fetchAlbums() {
	try {
		if (!db) return {};

		const tx = db.transaction("albums", "readonly");

		const store = tx.objectStore("albums");

		const request = store.getAll();

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				const albumsData = {};

				for (const album of request.result) {
					albumsData[album.id] = album;
				}

				albums.value = albumsData;

				resolve(albumsData);
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error("❌ Error fetching albums:", error);

		return {};
	}
}

export async function createAlbum(albumData) {
	try {
		if (!db) throw new Error("Database not initialized");

		trackEvent('album_created');

		const albumId = generateId();

		const album = {
			id: albumId,

			...albumData,

			created_at: new Date().toISOString(),
		};

		const tx = db.transaction("albums", "readwrite");

		const store = tx.objectStore("albums");

		await new Promise((resolve, reject) => {
			const request = store.put(album);

			request.onsuccess = resolve;

			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();

		return { success: true, album };
	} catch (error) {
		console.error("❌ Error creating album:", error);

		throw error;
	}
}

export async function updateAlbum(albumId, albumData) {
	try {
		if (!db) throw new Error("Database not initialized");

		const tx = db.transaction("albums", "readwrite");
		const store = tx.objectStore("albums");

		const existingAlbum = await new Promise((resolve, reject) => {
			const request = store.get(albumId);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});

		// Ensure cluster_ids is a plain array, not a proxy
		const updatedAlbum = {
			...existingAlbum,
			name: albumData.name,
			icon: albumData.icon,
			cluster_ids: Array.from(albumData.cluster_ids || existingAlbum.cluster_ids || []), // FIX: Convert to plain array
			id: albumId,
			updated_at: new Date().toISOString(),
		};

		await new Promise((resolve, reject) => {
			const request = store.put(updatedAlbum);
			request.onsuccess = resolve;
			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();
		return { success: true, album: updatedAlbum };
	} catch (error) {
		console.error("❌ Error updating album:", error);
		throw error;
	}
}

export async function deleteAlbumById(albumId) {
	try {
		if (!db) throw new Error("Database not initialized");

		const tx = db.transaction("albums", "readwrite");

		const store = tx.objectStore("albums");

		await new Promise((resolve, reject) => {
			const request = store.delete(albumId);

			request.onsuccess = resolve;

			request.onerror = () => reject(request.error);
		});

		await fetchAlbums();

		if (currentAlbum.value?.id === albumId) {
			currentAlbum.value = null;
		}

		return { success: true };
	} catch (error) {
		console.error("❌ Error deleting album:", error);

		throw error;
	}
}

export function toggleAlbumsDropdown() {
	showAlbumsDropdown.value = !showAlbumsDropdown.value;
	console.log(showAlbumsDropdown.value);
}

export function selectAlbum(album) {
	currentAlbum.value = album;
	showAlbumsDropdown.value = false;

	console.log(albums.value)
	console.log("Selected album:", album?.name || "All Clusters");

	// Reload everything with new filter
	loadData().then(() => {
		if (simulation) {
			simulation.nodes(graphData.nodes);
			simulation.force("link").links(graphData.links);
			simulation.alpha(1).restart();
			renderGraph();
		}
	});
}

export function createNewAlbum() {
	editingAlbum.value = null;
	albumForm.name = "";
	albumForm.icon = "📁";
	showAlbumModal.value = true;
	showAlbumsDropdown.value = false;
}

export function editAlbum(album) {
	editingAlbum.value = album;
	albumForm.name = album.name;
	albumForm.icon = album.icon;
	showAlbumModal.value = true;
	showAlbumsDropdown.value = false;
}

export async function saveAlbum() {
	if (!albumForm.name.trim()) return;

	try {
		const albumData = {
			name: albumForm.name.trim(),
			icon: albumForm.icon,
			cluster_ids: editingAlbum.value?.cluster_ids || [],
		};

		if (editingAlbum.value) {
			await updateAlbum(editingAlbum.value.id, albumData);
		} else {
			await createAlbum(albumData);
		}

		closeAlbumModal();
	} catch (error) {
		console.error("Error saving album:", error);
		alert("Failed to save album. Please try again.");
	}
}

export async function deleteAlbum(album) {
	if (!confirm(`Are you sure you want to delete "${album.name}"?`)) return;

	try {
		await deleteAlbumById(album.id);
	} catch (error) {
		console.error("Error deleting album:", error);
		alert("Failed to delete album. Please try again.");
	}
}

export function closeAlbumModal() {
	showAlbumModal.value = false;
	editingAlbum.value = null;
	albumForm.name = "";
	albumForm.icon = "📁";
}
