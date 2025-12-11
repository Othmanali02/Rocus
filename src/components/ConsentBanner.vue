<template>
    <div v-if="showBanner" class="fixed bottom-0 left-0 right-0 z-[4000] p-4 animate-slideInUp">
        <div class="max-w-4xl mx-auto rounded-2xl shadow-2xl p-6 border" :style="{
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border
        }">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6" :style="{ color: currentTheme.colors.primary }" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>

                <div class="flex-1">
                    <h3 class="text-lg font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
                        Help Improve Rocus
                    </h3>
                    <p class="text-sm mb-4" :style="{ color: currentTheme.colors.textSecondary }">
                        We use privacy-first analytics to understand how people use Rocus and improve the experience.
                        We collect <strong>zero personal data</strong>, no fingerprinting, no tracking across sites.
                        Just anonymous usage patterns to help us build better features.
                    </p>
                    <p class="text-xs mb-4" :style="{ color: currentTheme.colors.textSecondary }">
                        Your AI models, clusters, and websites stay 100% local. Only anonymous interaction data (like
                        "user clicked theme button") is collected.
                    </p>
                    <div class="flex items-center gap-3">
                        <button @click="acceptAnalytics"
                            class="px-6 py-2.5 rounded-xl font-medium transition-all text-white"
                            :style="{ backgroundColor: currentTheme.colors.primary }">
                            Accept & Help Improve
                        </button>
                        <button @click="declineAnalytics" class="px-6 py-2.5 rounded-xl font-medium transition-all"
                            :style="{
                                backgroundColor: currentTheme.colors.background,
                                color: currentTheme.colors.textSecondary
                            }">
                            No Thanks
                        </button>
                        <a href="/privacy" class="text-sm underline ml-auto"
                            :style="{ color: currentTheme.colors.textSecondary }">
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useAnalytics } from '../composables/useAnalytics';

const currentTheme = inject('currentTheme');
const { checkConsent, setConsent } = useAnalytics();

const showBanner = ref(false);

onMounted(() => {
    const consent = checkConsent();
    // Show banner if no consent decision made
    if (consent === null) {
        setTimeout(() => {
            showBanner.value = true;
        }, 3000); // Show after 3 seconds
    }
});

const acceptAnalytics = () => {
    setConsent(true);
    showBanner.value = false;
};

const declineAnalytics = () => {
    setConsent(false);
    showBanner.value = false;
};
</script>