import { ref } from "vue";
import { versionHistory } from "./versionHistoryData";

export { versionHistory } from "./versionHistoryData";
export const showVersionHistory = ref(false);

// "What's New" - a lighter-weight, auto-shown sibling of the full Version
// History modal above. Gated per-version (not per-user-account-age like the
// tutorial) - anyone who hasn't dismissed THIS version's entry yet sees it
// once, then never again for that version, whether they're a brand-new
// signup or a five-year returning user. A future release with new
// versionHistory[0] content re-triggers it for everyone again.
const WHATS_NEW_SEEN_KEY = "rocus-whats-new-seen";
export const showWhatsNew = ref(false);

export function checkShowWhatsNew() {
	const current = versionHistory[0];
	if (!current) return;
	if (localStorage.getItem(WHATS_NEW_SEEN_KEY) !== current.version) {
		showWhatsNew.value = true;
	}
}

export function dismissWhatsNew() {
	const current = versionHistory[0];
	if (current) localStorage.setItem(WHATS_NEW_SEEN_KEY, current.version);
	showWhatsNew.value = false;
}
