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

// Themed replacement for the browser's native alert()/confirm() - a single
// reactive dialog slot (only one is ever open at a time, matching how the
// app already only ever shows one modal at a time) rendered by
// RocusDialog.vue, mounted once in GraphNode.vue alongside PremiumUpsell.
//
// Both rocusAlert()/rocusConfirm() are async and return a Promise, exactly
// like the native functions they replace behave from a CALLER's point of
// view (window.confirm() blocks synchronously and returns a boolean;
// awaiting rocusConfirm() blocks the calling async function and resolves to
// the same boolean) - so every call site only ever needed
// `if (!confirm(...))` rewritten to `if (!(await rocusConfirm(...)))`, no
// other control-flow changes.

export const dialogState = ref(null);
// Shape while open: { type: 'alert' | 'confirm', title, message, confirmText, cancelText, danger, resolve }

export function rocusAlert(message, { title = "Rocus", confirmText = "OK" } = {}) {
	return new Promise((resolve) => {
		dialogState.value = { type: "alert", title, message, confirmText, resolve };
	});
}

export function rocusConfirm(message, { title = "Rocus", confirmText = "Yes", cancelText = "Cancel", danger = false } = {}) {
	return new Promise((resolve) => {
		dialogState.value = { type: "confirm", title, message, confirmText, cancelText, danger, resolve };
	});
}

export function resolveRocusDialog(value) {
	if (!dialogState.value) return;
	const { resolve } = dialogState.value;
	dialogState.value = null;
	resolve(value);
}
