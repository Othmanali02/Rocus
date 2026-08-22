import { ref } from "vue";

// Read synchronously at module init (mirrors the same pattern useAIModels.js
// uses for processingMode) so the toggle and trackEvent() both reflect a
// prior "accept" immediately on every page load/refresh - previously this
// stayed null until something called setConsent() again in that session,
// which made an already-accepted user look declined until they re-toggled,
// and silently dropped every event in the meantime since trackEvent() gates
// on this same value.
const storedConsent = localStorage.getItem("rocus-analytics-consent");
const analyticsConsent = ref(storedConsent === "true");
const analyticsLoaded = ref(false);

// useAnalytics() is called from many composables' own module scope (each
// runs once per page load, the first time that module is imported) - this
// guard makes sure the "already consented, so load Umami" bootstrap below
// only actually runs once regardless of how many callers there are.
let hasBootstrapped = false;

export function useAnalytics() {
	const setConsent = (value) => {
		analyticsConsent.value = value;
		localStorage.setItem("rocus-analytics-consent", value.toString());

		if (value) {
			loadUmami();
		} else {
			removeUmami();
		}
	};

	const loadUmami = () => {
		if (analyticsLoaded.value) return;

		const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
		const src = import.meta.env.VITE_UMAMI_SRC;

		if (!websiteId || !src) {
			console.warn("Umami not configured");
			return;
		}

		const script = document.createElement("script");
		script.async = true;
		script.defer = true;
		script.src = src;
		script.setAttribute("data-website-id", websiteId);
		script.setAttribute("data-domains", "rocus.io");
		script.setAttribute("data-auto-track", "true"); // CRITICAL
		script.setAttribute("data-cache", "true");

		script.onload = () => {
			analyticsLoaded.value = true;

			// Wait for umami to be available, then force track
			let attempts = 0;
			const checkUmami = setInterval(() => {
				attempts++;
				if (window.umami) {
					console.log("window.umami available");
					clearInterval(checkUmami);

					// Force immediate pageview
					console.log("Forcing pageview");
					window.umami.track("pageview");

					window.umami.track("app-loaded", {
						timestamp: Date.now(),
						path: window.location.pathname,
					});
				} else if (attempts > 20) {
					console.error("window.umami never became available");
					clearInterval(checkUmami);
				}
			}, 100);
		};

		script.onerror = (error) => {
			console.error(" Failed to load Umami:", error);
		};

		document.head.appendChild(script);
		console.log(" Umami script added to DOM");
	};

	const removeUmami = () => {
		const scripts = document.querySelectorAll("script[data-website-id]");
		scripts.forEach((script) => script.remove());
		analyticsLoaded.value = false;
	};

	const trackEvent = (eventName, eventData = {}) => {
		if (!analyticsConsent.value || !analyticsLoaded.value) {
			return;
		}

		if (window.umami) {
			window.umami.track(eventName, eventData);
		} else {
			console.error("window.umami not available");
		}
	};

	// Public marketing pages (landing, pricing) aren't in-app usage - they're
	// basic, cookieless visit stats (page views/referrer/country/browser,
	// same as Umami's own data-auto-track) rather than the opt-in in-app
	// behavior tracking analyticsConsent gates. loadUmami()/trackEvent() are
	// left untouched so the Settings "Help Improve Rocus" toggle keeps
	// controlling in-app tracking exactly as before.
	const loadUmamiUnconditional = () => {
		if (analyticsLoaded.value) return;

		const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
		const src = import.meta.env.VITE_UMAMI_SRC;

		if (!websiteId || !src) {
			console.warn("Umami not configured");
			return;
		}

		const script = document.createElement("script");
		script.async = true;
		script.defer = true;
		script.src = src;
		script.setAttribute("data-website-id", websiteId);
		script.setAttribute("data-domains", "rocus.io");
		script.setAttribute("data-auto-track", "true");
		script.setAttribute("data-cache", "true");

		script.onload = () => {
			analyticsLoaded.value = true;
		};

		script.onerror = (error) => {
			console.error("Failed to load Umami:", error);
		};

		document.head.appendChild(script);
	};

	// script.onload just means the umami script executed, not that
	// window.umami has finished initializing yet - mirrors loadUmami()'s own
	// poll so a track() call fired right after mount isn't dropped.
	const trackEventUnconditional = (eventName, eventData = {}, attempt = 0) => {
		if (window.umami) {
			window.umami.track(eventName, eventData);
		} else if (attempt < 20) {
			setTimeout(() => trackEventUnconditional(eventName, eventData, attempt + 1), 100);
		}
	};

	// Bootstrap: a returning user who already consented in a past session
	// should have analytics actually running from the start, not just show
	// the toggle as "on" - previously this only ever happened as a side
	// effect of calling setConsent(true), which never fired again on its own
	// after a refresh.
	if (!hasBootstrapped) {
		hasBootstrapped = true;
		if (analyticsConsent.value) {
			loadUmami();
		}
	}

	return {
		analyticsConsent,
		analyticsLoaded,
		setConsent,
		trackEvent,
		loadUmamiUnconditional,
		trackEventUnconditional,
	};
}
