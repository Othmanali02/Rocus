import { ref } from "vue";

// IndexedDB connection lifecycle + platform detection.
// `db` is a plain (non-reactive) module-level binding, mirroring the original
// `let db = null` — every other composable imports it and only ever reads it
// or calls methods on it; this file is the sole place that reassigns it.

export let db = null;

export const platform = ref("");

export function detectPlatform() {
	const userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.includes("linux")) return "Linux";
	if (userAgent.includes("mac")) return "macOS";
	if (userAgent.includes("win")) return "Windows";
	return "Unknown";
}

export function initDB() {
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

export async function checkAndRepairDatabase() {
	try {
		const testDB = await new Promise((resolve, reject) => {
			const request = indexedDB.open('_health_check_', 1);
			request.onsuccess = () => {
				request.result.close();
				indexedDB.deleteDatabase('_health_check_');
				resolve(true);
			};
			request.onerror = () => reject(request.error);
			request.onblocked = () => reject(new Error('IndexedDB blocked'));
		});

		console.log('✅ IndexedDB health check passed');
		return true;

	} catch (error) {
		console.error('❌ IndexedDB corruption detected:', error);

		const shouldReset = confirm(
			'Database Error Detected\n\n' +
			'Your browser storage appears corrupted. This happens when:\n' +
			'• Browser crashed during save\n' +
			'• Multiple tabs competed for storage\n' +
			'• Storage quota exceeded\n\n' +
			'Click OK to reset and fix the issue.\n' +
			'Click Cancel to try manual fixes first.'
		);

		if (shouldReset) {
			await resetDatabase();
			location.reload();
		} else {
			alert(
				'Manual Fix Instructions:\n\n' +
				'Windows:\n' +
				'1. Close ALL browser windows\n' +
				'2. Delete: %USERPROFILE%\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\n' +
				'3. Restart browser\n\n' +
				'Mac:\n' +
				'1. Close ALL browser windows\n' +
				'2. Delete: ~/Library/Application Support/Google/Chrome/Default/IndexedDB\n' +
				'3. Restart browser\n\n' +
				'Or use Chrome DevTools:\n' +
				'F12 → Application → Storage → Clear site data'
			);
		}

		return false;
	}
}

export async function resetDatabase() {
	try {
		console.log('Resetting database...');

		// Close all DB connections
		if (db) {
			db.close();
			db = null;
		}

		// Clear IndexedDB
		const databases = await indexedDB.databases();
		for (const dbInfo of databases) {
			if (dbInfo.name && (dbInfo.name.includes('FunkyAIDB') || dbInfo.name.includes('mlc'))) {
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

		if ('caches' in window) {
			const cacheNames = await caches.keys();
			for (const name of cacheNames) {
				await caches.delete(name);
				console.log(`Deleted cache: ${name}`);
			}
		}

		localStorage.clear();

		console.log('Database reset complete');

	} catch (error) {
		console.error('Reset failed:', error);
		alert('Automatic reset failed. Please manually clear site data:\n\n' +
			'Chrome DevTools (F12) → Application → Storage → Clear site data');
	}
}
