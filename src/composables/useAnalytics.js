import { ref } from "vue";

const analyticsConsent = ref(null);
const analyticsLoaded = ref(false);

export function useAnalytics() {
	const checkConsent = () => {
		const consent = localStorage.getItem("rocus-analytics-consent");
		analyticsConsent.value = consent === "true";
		return analyticsConsent.value;
	};

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
		script.setAttribute("data-do-not-track", "true"); // Respects Do Not Track
		script.setAttribute("data-cache", "true");

		document.head.appendChild(script);
		analyticsLoaded.value = true;

		console.log("Privacy-first analytics enabled");
	};

	const removeUmami = () => {
		// Remove script if loaded
		const scripts = document.querySelectorAll("script[data-website-id]");
		scripts.forEach((script) => script.remove());
		analyticsLoaded.value = false;

		console.log("Analytics disabled");
	};

	// Track custom events (only if consent given)
	const trackEvent = (eventName, eventData = {}) => {
		if (!analyticsConsent.value || !analyticsLoaded.value) return;

		// Umami's global umami object
		if (window.umami) {
			window.umami.track(eventName, eventData);
		}
	};

	return {
		analyticsConsent,
        analyticsLoaded,
		checkConsent,
		setConsent,
		trackEvent,
	};
}