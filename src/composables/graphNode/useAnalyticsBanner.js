import { ref } from "vue";
import { useAnalytics } from "../useAnalytics";

// "Help Rocus Become Better" consent banner shown on the graph page.
// Wraps the shared useAnalytics composable rather than modifying it, since
// useAnalytics is also used by Landing.vue.
const { analyticsConsent, setConsent } = useAnalytics();

export const showBanner = ref(false);

export function toggleAnalytics() {
	setConsent(!analyticsConsent.value);
}

export function promptConsent() {
	const consent = localStorage.getItem('rocus-analytics-consent');
	if (consent === null) {
		setTimeout(() => {
			showBanner.value = true;
		}, 5000);
	}
}

export function accept() {
	setConsent(true);
	showBanner.value = false;
}

export function decline() {
	setConsent(false);
	showBanner.value = false;
}
