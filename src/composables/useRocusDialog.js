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
