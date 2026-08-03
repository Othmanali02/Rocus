import { ref, computed } from "vue";
import { tutorialSteps as tutorialStepsData, tutorialStepsEmpty } from "./tutorialData";
import { graphData, container, explodeNode, collapseNode } from "./useGraphEngine";

// Real, published extension IDs (Chrome Web Store / addons.mozilla.org - same
// ones Landing.vue's installExtension() links to). Both extensions' manifests
// declare rocus.io (+ localhost:5173 for dev) in externally_connectable, which
// is what lets an ordinary web page - not another extension - reach them via
// chrome.runtime.sendMessage/browser.runtime.sendMessage at all.
const CHROME_EXTENSION_ID = "ekhebfoaaokmbhieckfkpapfkiicpbma";
const FIREFOX_EXTENSION_ID = "rocus@rocus.io";

// null = still checking, true/false = resolved. Read by the "Browser
// Extension" tutorial step to show install-needed messaging only when the
// extension genuinely isn't reachable, instead of always nagging.
export const extensionDetected = ref(null);

export const extensionStoreUrl = computed(() =>
	navigator.userAgent.toLowerCase().includes("firefox")
		? "https://addons.mozilla.org/en-US/firefox/addon/rocus/"
		: "https://chromewebstore.google.com/detail/rocus/ekhebfoaaokmbhieckfkpapfkiicpbma"
);

function detectRocusExtension(timeoutMs = 700) {
	return new Promise((resolve) => {
		let settled = false;
		const finish = (installed) => {
			if (settled) return;
			settled = true;
			resolve(installed);
		};
		const timer = setTimeout(() => finish(false), timeoutMs);

		try {
			if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
				chrome.runtime.sendMessage(CHROME_EXTENSION_ID, { type: "ROCUS_PING" }, (response) => {
					clearTimeout(timer);
					// chrome.runtime.lastError is set (not thrown) when there's no
					// listening extension at that ID - has to be read either way or
					// it logs an "Unchecked runtime.lastError" console warning.
					const err = chrome.runtime.lastError;
					finish(!err && response?.type === "ROCUS_PONG");
				});
				return;
			}
			if (typeof browser !== "undefined" && browser.runtime?.sendMessage) {
				browser.runtime
					.sendMessage(FIREFOX_EXTENSION_ID, { type: "ROCUS_PING" })
					.then((response) => {
						clearTimeout(timer);
						finish(response?.type === "ROCUS_PONG");
					})
					.catch(() => {
						clearTimeout(timer);
						finish(false);
					});
				return;
			}
		} catch {
			// chrome.runtime.sendMessage can throw synchronously (not just via
			// lastError) for a malformed ID or an unexpectedly-absent API -
			// falls through to "not installed" below either way.
		}
		clearTimeout(timer);
		finish(false);
	});
}

// Onboarding tutorial overlay. Reads graphData/container/explodeNode/collapseNode
// from useGraphEngine (one direction only - useGraphEngine never reads anything
// from this file, so this pairing is fully acyclic).

export const tutorialActive = ref(false);
export const tutorialStep = ref(0);
export const tutorialHighlightRect = ref({ top: 0, left: 0, width: 0, height: 0 });
export const tutorialDemoCluster = ref(null);

// Mutable copy so startTutorialEmpty() can splice in the empty-state steps,
// exactly like the original component's top-level `const tutorialSteps = [...]`.
export const tutorialSteps = [...tutorialStepsData];

export function startTutorial() {
	tutorialActive.value = true;
	tutorialStep.value = 0;
	updateTutorialHighlight();
}

export function startTutorialEmpty() {
	tutorialActive.value = true;
	tutorialStep.value = 0;
	// Use empty state tutorial steps
	const originalSteps = [...tutorialSteps];
	tutorialSteps.splice(0, tutorialSteps.length, ...tutorialStepsEmpty);

	// Store original steps to restore later
	window._originalTutorialSteps = originalSteps;

	updateTutorialHighlight();
}

export function nextTutorialStep() {
	if (tutorialStep.value < tutorialSteps.length - 1) {
		tutorialStep.value++;
		updateTutorialHighlight();
		performTutorialAction();
	} else {
		finishTutorial();
	}
}

export function previousTutorialStep() {
	if (tutorialStep.value > 0) {
		tutorialStep.value--;
		updateTutorialHighlight();
		performTutorialAction();
	}
}

export function skipTutorial() {
	// Cleanup demo cluster
	if (tutorialDemoCluster.value) {
		collapseNode();
		tutorialDemoCluster.value = null;
	}
	finishTutorial();
}

export function finishTutorial() {
	// Cleanup demo cluster
	if (tutorialDemoCluster.value) {
		collapseNode();
		tutorialDemoCluster.value = null;
	}

	tutorialActive.value = false;
	tutorialStep.value = 0;
	tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
	localStorage.setItem('rocus-tutorial-completed', 'true');
}

export function updateTutorialHighlight() {
	const step = tutorialSteps[tutorialStep.value];

	if (!step.highlight) {
		tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
		return;
	}

	// Small delay to ensure DOM is ready
	setTimeout(() => {
		let element;

		switch (step.highlight) {
			case 'model-status':
				// Find the model status button - try multiple selectors
				const allButtons = document.querySelectorAll('button');
				// Look for button with computer/monitor icon or loading spinner
				element = Array.from(allButtons).find(btn => {
					const svg = btn.querySelector('svg');
					return svg && (
						svg.innerHTML.includes('M9.75 17L9 20') || // Computer icon path
						svg.innerHTML.includes('M4 4v5') // Loading spinner path
					);
				});
				// Fallback: 3rd button in header
				if (!element) {
					const buttons = document.querySelectorAll('.flex.items-center.gap-3 button');
					element = buttons[2];
				}
				break;

			case 'albums-dropdown':
				element = document.querySelector('.flex-1.max-w-2xl .relative button') ||
					document.querySelector('button[class*="w-full"]');
				break;

			case 'graph-container':
				element = document.getElementById('graph-container');
				break;

			case 'demo-cluster':
				// Only try to highlight if we have clusters
				if (tutorialDemoCluster.value && container) {
					const node = container.select('.nodes')
						.selectAll('.node')
						.filter(d => d.id === tutorialDemoCluster.value.id)
						.node();
					element = node;
				}

				// Fallback to graph container if no demo cluster
				if (!element) {
					element = document.getElementById('graph-container');
				}
				break;

			case 'theme-button':
				// Theme button is 1st button in header - look for palette icon
				const headerButtons = document.querySelectorAll('button');
				element = Array.from(headerButtons).find(btn => {
					const svg = btn.querySelector('svg');
					return svg && svg.innerHTML.includes('M7 21a4 4'); // Palette icon path
				});
				// Fallback: first button
				if (!element) {
					element = document.querySelectorAll('.flex.items-center.gap-3 button')[0];
				}
				break;

			case 'search-bar':
				element = document.querySelector('.fixed.top-24') ||
					document.querySelector('input[type="text"]');
				break;

			case 'share-button':
				// Share icon - safe to always expect this element since the
				// tutorial only ever runs on the owner's own /dashboard (the
				// shared-graph view skips the tutorial entirely, see GraphNode.vue).
				element = Array.from(document.querySelectorAll('button')).find(btn => {
					const svg = btn.querySelector('svg');
					return svg && svg.innerHTML.includes('M3 16.5v2.25');
				});
				break;
		}

		if (element) {
			const rect = element.getBoundingClientRect();
			tutorialHighlightRect.value = {
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height
			};
		} else {
			// If element not found, clear highlight
			console.warn(`Tutorial element not found: ${step.highlight}`);
			tutorialHighlightRect.value = { top: 0, left: 0, width: 0, height: 0 };
		}
	}, 100);
}

export function performTutorialAction() {
	const step = tutorialSteps[tutorialStep.value];

	if (step.action === 'showDemoCluster') {
		// Check if we have clusters
		if (graphData?.nodes?.length > 0) {
			const clusterNodes = graphData.nodes.filter(n => n.type === 'cluster');
			if (clusterNodes.length > 0) {
				tutorialDemoCluster.value = clusterNodes[0];
				updateTutorialHighlight();
			} else {
				// No clusters, skip to next step
				console.log("No clusters available, skipping demo");
				nextTutorialStep();
			}
		} else {
			// No data at all, skip to next step
			console.log("No graph data, skipping demo");
			nextTutorialStep();
		}
	} else if (step.action === 'explodeDemoCluster') {
		// Only explode if we have a demo cluster with websites
		if (tutorialDemoCluster.value && tutorialDemoCluster.value.websites?.length > 0) {
			explodeNode(tutorialDemoCluster.value);
		} else {
			// Can't demonstrate, skip to next step
			console.log("No websites to explode, skipping demo");
			nextTutorialStep();
		}
	} else if (step.action === 'checkExtension') {
		extensionDetected.value = null;
		detectRocusExtension().then((installed) => {
			// Stale-response guard: if the user has already navigated off this
			// step (or restarted the tutorial) by the time this resolves, don't
			// overwrite whatever the current state should be.
			if (tutorialSteps[tutorialStep.value]?.action === 'checkExtension') {
				extensionDetected.value = installed;
			}
		});
	} else if (step.action === 'cleanup') {
		// Collapse any exploded node
		if (tutorialDemoCluster.value) {
			collapseNode();
			tutorialDemoCluster.value = null;
		}

		// Restore original tutorial steps if we used empty state version
		if (window._originalTutorialSteps) {
			tutorialSteps.splice(0, tutorialSteps.length, ...window._originalTutorialSteps);
			delete window._originalTutorialSteps;
		}
	}
}
