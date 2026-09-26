/*
 * Copyright (C) 2025-2026 Rocus
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

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
