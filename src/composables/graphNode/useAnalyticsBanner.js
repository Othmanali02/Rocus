/*
 * Copyright (C) 2025-2026 Othman Ali
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
