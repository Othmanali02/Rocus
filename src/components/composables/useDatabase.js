import { ref } from "vue";

let db = null;

export function useDatabase() {
	async function initDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open("FunkyAIDB", 2);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				db = request.result;
				resolve(db);
			};

			request.onupgradeneeded = (event) => {
				const database = event.target.result;

				if (!database.objectStoreNames.contains("websites")) {
					database.createObjectStore("websites", { keyPath: "id" });
				}
				if (!database.objectStoreNames.contains("clusters")) {
					database.createObjectStore("clusters", { keyPath: "id" });
				}
				if (!database.objectStoreNames.contains("embeddings")) {
					database.createObjectStore("embeddings", { keyPath: "id" });
				}
				if (!database.objectStoreNames.contains("albums")) {
					database.createObjectStore("albums", { keyPath: "id" });
				}
				if (!database.objectStoreNames.contains("queue")) {
					database.createObjectStore("queue", { keyPath: "id" });
				}
			};
		});
	}

	async function saveToIndexedDB(websites, clusters, embeddings) {
		if (!db) return;

		try {
			const tx = db.transaction(
				["websites", "clusters", "embeddings"],
				"readwrite"
			);

			const websiteStore = tx.objectStore("websites");
			await new Promise((resolve, reject) => {
				const r = websiteStore.clear();
				r.onsuccess = resolve;
				r.onerror = () => reject(r.error);
			});

			for (const website of Object.values(websites.value)) {
				try {
					const plainWebsite = JSON.parse(JSON.stringify(website));
					await new Promise((resolve, reject) => {
						const r = websiteStore.put(plainWebsite);
						r.onsuccess = resolve;
						r.onerror = () => reject(r.error);
					});
				} catch (err) {
					console.error("❌ WEBSITE FAILED:", website, err);
				}
			}

			const clusterStore = tx.objectStore("clusters");
			await new Promise((resolve, reject) => {
				const r = clusterStore.clear();
				r.onsuccess = resolve;
				r.onerror = () => reject(r.error);
			});

			for (const cluster of Object.values(clusters.value)) {
				try {
					const plainCluster = JSON.parse(JSON.stringify(cluster));
					await new Promise((resolve, reject) => {
						const r = clusterStore.put(plainCluster);
						r.onsuccess = resolve;
						r.onerror = () => reject(r.error);
					});
				} catch (err) {
					console.error("❌ CLUSTER FAILED:", cluster, err);
				}
			}

			const embeddingStore = tx.objectStore("embeddings");
			await new Promise((resolve, reject) => {
				const r = embeddingStore.clear();
				r.onsuccess = resolve;
				r.onerror = () => reject(r.error);
			});

			for (const [id, embedding] of Object.entries(embeddings.value)) {
				try {
					const plainEmbedding = {
						id,
						embedding: Array.from(embedding),
					};
					await new Promise((resolve, reject) => {
						const r = embeddingStore.put(plainEmbedding);
						r.onsuccess = resolve;
						r.onerror = () => reject(r.error);
					});
				} catch (err) {
					console.error(`❌ EMBEDDING FAILED [${id}]`, embedding, err);
				}
			}

			await new Promise((resolve, reject) => {
				tx.oncomplete = resolve;
				tx.onerror = () => reject(tx.error);
				tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
			});

			console.log("✨ IndexedDB Save Complete");
		} catch (err) {
			console.error("🔥 FATAL IndexedDB SAVE ERROR:", err);
		}
	}

	// FIXED: Now accepts refs as parameters and returns loaded data
	async function loadFromIndexedDB(websites, clusters, embeddings) {
		if (!db) return { websites: {}, clusters: {}, embeddings: {} };

		try {
			const loadedData = {
				websites: {},
				clusters: {},
				embeddings: {},
			};

			// Load websites
			const websiteTx = db.transaction("websites", "readonly");
			const websiteStore = websiteTx.objectStore("websites");
			const websiteRequest = websiteStore.getAll();

			await new Promise((resolve) => {
				websiteRequest.onsuccess = () => {
					for (const website of websiteRequest.result) {
						loadedData.websites[website.id] = website;
						if (websites) websites.value[website.id] = website;
					}
					resolve();
				};
			});

			// Load clusters
			const clusterTx = db.transaction("clusters", "readonly");
			const clusterStore = clusterTx.objectStore("clusters");
			const clusterRequest = clusterStore.getAll();

			await new Promise((resolve) => {
				clusterRequest.onsuccess = () => {
					for (const cluster of clusterRequest.result) {
						loadedData.clusters[cluster.id] = cluster;
						if (clusters) clusters.value[cluster.id] = cluster;
					}
					resolve();
				};
			});

			// Load embeddings
			const embeddingTx = db.transaction("embeddings", "readonly");
			const embeddingStore = embeddingTx.objectStore("embeddings");
			const embeddingRequest = embeddingStore.getAll();

			await new Promise((resolve) => {
				embeddingRequest.onsuccess = () => {
					for (const item of embeddingRequest.result) {
						loadedData.embeddings[item.id] = item.embedding;
						if (embeddings) embeddings.value[item.id] = item.embedding;
					}
					resolve();
				};
			});

			console.log("✅ Loaded data from IndexedDB");
			return loadedData;
		} catch (err) {
			console.error("Error loading from IndexedDB:", err);
			return { websites: {}, clusters: {}, embeddings: {} };
		}
	}

	async function checkAndRepairDatabase() {
		try {
			const testDB = await new Promise((resolve, reject) => {
				const request = indexedDB.open("_health_check_", 1);
				request.onsuccess = () => {
					request.result.close();
					indexedDB.deleteDatabase("_health_check_");
					resolve(true);
				};
				request.onerror = () => reject(request.error);
				request.onblocked = () => reject(new Error("IndexedDB blocked"));
			});

			console.log("✅ IndexedDB health check passed");
			return true;
		} catch (error) {
			console.error("❌ IndexedDB corruption detected:", error);

			const shouldReset = confirm(
				"Database Error Detected\n\n" +
					"Your browser storage appears corrupted. This happens when:\n" +
					"• Browser crashed during save\n" +
					"• Multiple tabs competed for storage\n" +
					"• Storage quota exceeded\n\n" +
					"Click OK to reset and fix the issue.\n" +
					"Click Cancel to try manual fixes first."
			);

			if (shouldReset) {
				await resetDatabase();
				location.reload();
			} else {
				alert(
					"Manual Fix Instructions:\n\n" +
						"Windows:\n" +
						"1. Close ALL browser windows\n" +
						"2. Delete: %USERPROFILE%\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\n" +
						"3. Restart browser\n\n" +
						"Mac:\n" +
						"1. Close ALL browser windows\n" +
						"2. Delete: ~/Library/Application Support/Google/Chrome/Default/IndexedDB\n" +
						"3. Restart browser\n\n" +
						"Or use Chrome DevTools:\n" +
						"F12 → Application → Storage → Clear site data"
				);
			}

			return false;
		}
	}

	async function resetDatabase() {
		try {
			console.log("Resetting database...");

			if (db) {
				db.close();
				db = null;
			}

			const databases = await indexedDB.databases();
			for (const dbInfo of databases) {
				if (
					dbInfo.name &&
					(dbInfo.name.includes("FunkyAIDB") || dbInfo.name.includes("mlc"))
				) {
					await new Promise((resolve, reject) => {
						const request = indexedDB.deleteDatabase(dbInfo.name);
						request.onsuccess = () => resolve();
						request.onerror = () => reject(request.error);
						request.onblocked = () => {
							console.warn(`Blocked deleting ${dbInfo.name}, forcing...`);
							setTimeout(resolve, 1000);
						};
					});
					console.log(`Deleted database: ${dbInfo.name}`);
				}
			}

			if ("caches" in window) {
				const cacheNames = await caches.keys();
				for (const name of cacheNames) {
					await caches.delete(name);
					console.log(`Deleted cache: ${name}`);
				}
			}

			localStorage.clear();

			console.log("Database reset complete");
		} catch (error) {
			console.error("Reset failed:", error);
			alert(
				"Automatic reset failed. Please manually clear site data:\n\n" +
					"Chrome DevTools (F12) → Application → Storage → Clear site data"
			);
		}
	}

	return {
		db: () => db,
		initDB,
		saveToIndexedDB,
		loadFromIndexedDB,
		checkAndRepairDatabase,
		resetDatabase,
	};
}
