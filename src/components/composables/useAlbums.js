import { ref } from "vue";
import { generateId } from "../utils/helpers";
import { useAnalytics } from "./useAnalytics";

export function useAlbums() {
	const { trackEvent } = useAnalytics();

	const albums = ref({});
	const currentAlbum = ref(null);
	const showAlbumsDropdown = ref(false);

	async function fetchAlbums(db) {
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

	async function createAlbum(albumData, db) {
		try {
			if (!db) throw new Error("Database not initialized");
			trackEvent("album_created");

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

			await fetchAlbums(db); // FIXED: Added db parameter
			return { success: true, album };
		} catch (error) {
			console.error("❌ Error creating album:", error);
			throw error;
		}
	}

	async function updateAlbum(albumId, albumData, db) {
		try {
			if (!db) throw new Error("Database not initialized");
			const tx = db.transaction("albums", "readwrite");
			const store = tx.objectStore("albums");

			const existingAlbum = await new Promise((resolve, reject) => {
				const request = store.get(albumId);
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});

			const updatedAlbum = {
				...existingAlbum,
				name: albumData.name,
				icon: albumData.icon,
				cluster_ids: Array.from(
					albumData.cluster_ids || existingAlbum.cluster_ids || []
				),
				id: albumId,
				updated_at: new Date().toISOString(),
			};

			await new Promise((resolve, reject) => {
				const request = store.put(updatedAlbum);
				request.onsuccess = resolve;
				request.onerror = () => reject(request.error);
			});

			await fetchAlbums(db); // FIXED: Added db parameter
			return { success: true, album: updatedAlbum };
		} catch (error) {
			console.error("❌ Error updating album:", error);
			throw error;
		}
	}

	async function deleteAlbumById(albumId, db) {
		try {
			if (!db) throw new Error("Database not initialized");
			const tx = db.transaction("albums", "readwrite");
			const store = tx.objectStore("albums");

			await new Promise((resolve, reject) => {
				const request = store.delete(albumId);
				request.onsuccess = resolve;
				request.onerror = () => reject(request.error);
			});

			await fetchAlbums(db); // FIXED: Added db parameter

			if (currentAlbum.value?.id === albumId) {
				currentAlbum.value = null;
			}

			return { success: true };
		} catch (error) {
			console.error("❌ Error deleting album:", error);
			throw error;
		}
	}

	function selectAlbum(album) {
		currentAlbum.value = album;
		showAlbumsDropdown.value = false;
		console.log("Selected album:", album?.name || "All Clusters");
		// NOTE: loadData, simulation, graphData, renderGraph should be called from parent component
		// This function should emit an event instead
	}

	return {
		albums,
		currentAlbum,
		showAlbumsDropdown,
		fetchAlbums,
		createAlbum,
		updateAlbum,
		deleteAlbumById,
		selectAlbum,
	};
}
