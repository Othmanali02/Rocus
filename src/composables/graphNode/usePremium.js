import { computed, ref, watch } from 'vue';
import { store } from '../../router/store';
import { API_BASE } from '../../components/constants/config';
import { processingMode, setProcessingMode } from './useAIModels';

export const isPremium = computed(() => !!store.user?.premium);
export const showPremiumModal = ref(false);

export function openPremiumModal() {
	showPremiumModal.value = true;
}

export function closePremiumModal() {
	showPremiumModal.value = false;
}

export function signInUrl() {
	return `${API_BASE}/api/auth/login`;
}

// A user who flipped Cloud AI Processing on before Premium gating existed
// (or whose Premium status has since lapsed) shouldn't stay on commercial
// mode just because their browser's localStorage still says so. Gated on
// store.authChecked so this doesn't fire on the initial `isPremium === false`
// before /api/auth/user-info has resolved - otherwise a premium user's saved
// 'commercial' choice gets clobbered back to 'local' every page load, before
// their premium status is even confirmed.
watch(
	() => [isPremium.value, store.authChecked],
	([premium, authChecked]) => {
		if (!authChecked) return;
		if (!premium && processingMode.value === 'commercial') {
			setProcessingMode('local');
		}
	},
	{ immediate: true }
);
