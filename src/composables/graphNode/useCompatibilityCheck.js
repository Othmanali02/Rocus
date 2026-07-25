import { ref } from "vue";

// Browser/hardware compatibility check shown on first run (WebGPU, memory, IndexedDB, Cache API).
// Module-level singleton: GraphNode.vue only ever mounts once, so state lives at module scope
// rather than behind a factory function, the same way it lived on the single component instance before.

export const showCompatibilityCheck = ref(false);
export const compatibilityResults = ref({
	webgpu: { status: 'checking', message: '' },
	memory: { status: 'checking', message: '' },
	indexeddb: { status: 'checking', message: '' },
	cache: { status: 'checking', message: '' },
	overall: 'checking'
});

export async function checkSystemCompatibility() {
	compatibilityResults.value = {
		webgpu: { status: 'checking', message: 'Checking WebGPU support...' },
		memory: { status: 'checking', message: 'Checking available memory...' },
		indexeddb: { status: 'checking', message: 'Checking IndexedDB...' },
		cache: { status: 'checking', message: 'Checking Cache API...' },
		overall: 'checking'
	};

	let allPassed = true;

	try {
		if (!navigator.gpu) {
			compatibilityResults.value.webgpu = {
				status: 'error',
				message: 'WebGPU not supported. Your browser/device doesn\'t support WebGPU.',
				fix: 'Try Chrome/Edge 113+, or enable chrome://flags/#enable-unsafe-webgpu'
			};
			allPassed = false;
		} else {
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter) {
				compatibilityResults.value.webgpu = {
					status: 'error',
					message: 'WebGPU adapter not available. Hardware may not support it.',
					fix: 'Update your GPU drivers or try a different browser'
				};
				allPassed = false;
			} else {
				compatibilityResults.value.webgpu = {
					status: 'success',
					message: 'WebGPU supported ✓'
				};
			}
		}
	} catch (err) {
		compatibilityResults.value.webgpu = {
			status: 'error',
			message: `WebGPU check failed: ${err.message}`,
			fix: 'Try using Chrome/Edge in incognito mode or update your browser'
		};
		allPassed = false;
	}

	try {
		if (performance.memory) {
			const memoryMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
			if (memoryMB < 500) {
				compatibilityResults.value.memory = {
					status: 'warning',
					message: `Low memory available: ${Math.round(memoryMB)}MB. May be slow.`,
					fix: 'Close other tabs or restart your browser'
				};
			} else {
				compatibilityResults.value.memory = {
					status: 'success',
					message: `Memory OK: ${Math.round(memoryMB)}MB available ✓`
				};
			}
		} else {
			compatibilityResults.value.memory = {
				status: 'success',
				message: 'Memory check not available (non-Chrome browser) ✓'
			};
		}
	} catch (err) {
		compatibilityResults.value.memory = {
			status: 'warning',
			message: 'Could not check memory'
		};
	}

	try {
		const testDB = await new Promise((resolve, reject) => {
			const request = indexedDB.open('_rocus_test', 1);
			request.onsuccess = () => {
				request.result.close();
				indexedDB.deleteDatabase('_rocus_test');
				resolve(true);
			};
			request.onerror = () => reject(request.error);
		});
		compatibilityResults.value.indexeddb = {
			status: 'success',
			message: 'IndexedDB working ✓'
		};
	} catch (err) {
		compatibilityResults.value.indexeddb = {
			status: 'error',
			message: 'IndexedDB unavailable or blocked',
			fix: 'Enable cookies and site data in browser settings'
		};
		allPassed = false;
	}

	try {
		if ('caches' in window) {
			const cache = await caches.open('_rocus_test');
			await caches.delete('_rocus_test');
			compatibilityResults.value.cache = {
				status: 'success',
				message: 'Cache API working ✓'
			};
		} else {
			compatibilityResults.value.cache = {
				status: 'warning',
				message: 'Cache API not available',
				fix: 'This may affect model loading. Try incognito mode.'
			};
		}
	} catch (err) {
		if (err.message.includes('Cache') || err.message.includes('quota')) {
			compatibilityResults.value.cache = {
				status: 'error',
				message: 'Cache API error (common Chrome issue)',
				fix: 'Use incognito mode, or clear site data in Settings → Privacy'
			};
		} else {
			compatibilityResults.value.cache = {
				status: 'warning',
				message: `Cache check failed: ${err.message}`,
				fix: 'Try incognito mode if models fail to load'
			};
		}
	}

	compatibilityResults.value.overall = allPassed ? 'success' : 'error';

	return allPassed;
}

// Only meaningful for local (on-device WebGPU) mode - checking WebGPU/memory
// readiness makes no sense for a commercial-mode user who never touches the
// local model. Callers gate on processingMode; this only re-gates on "have we
// already checked, ever" so it's safe to call every time someone enters local
// mode without re-showing the modal after the first successful check.
export async function runCompatibilityCheckIfNeeded() {
	if (localStorage.getItem('rocus-compatibility-checked')) return;

	showCompatibilityCheck.value = true;
	await checkSystemCompatibility();

	if (compatibilityResults.value.overall === 'success') {
		setTimeout(() => {
			showCompatibilityCheck.value = false;
			localStorage.setItem('rocus-compatibility-checked', 'true');
		}, 3000);
	}
}
