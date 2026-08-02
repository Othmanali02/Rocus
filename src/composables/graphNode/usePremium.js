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
