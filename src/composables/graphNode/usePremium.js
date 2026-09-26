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

import { computed, ref } from 'vue';
import { store } from '../../router/store';
import { API_BASE } from '../../components/constants/config';

export const isPremium = computed(() => !!store.user?.premium);
export const showPremiumModal = ref(false);
// null (default) = the original Cloud AI Processing upsell. Other values
// pick a different, contextual message in PremiumUpsell.vue for a trigger
// that has nothing to do with AI processing (e.g. a sharing limit).
export const premiumModalReason = ref(null);

export function openPremiumModal(reason = null) {
	premiumModalReason.value = reason;
	showPremiumModal.value = true;
}

export function closePremiumModal() {
	showPremiumModal.value = false;
}

export function signInUrl() {
	return `${API_BASE}/api/auth/login`;
}

// Same Logto-hosted flow as signInUrl() - there's no separate sign-up app,
// just a query param (?screen=signup, translated server-side into Logto's
// own first_screen=register) that jumps straight to the registration screen
// instead of Logto's default sign-in-first form. Used where the visitor is
// very likely a brand-new person discovering Rocus (e.g. trying to share a
// graph while signed out) rather than someone who forgot they have an account.
export function signUpUrl() {
	return `${API_BASE}/api/auth/login?screen=signup`;
}
