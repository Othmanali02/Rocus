<template>
    <div class="min-h-screen p-8 overflow-y-auto" :style="{ backgroundColor: currentTheme.colors.background }">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-8">
                <button @click="$router.back()" class="p-2 rounded-xl transition-all" :style="{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text
                }">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-4xl font-bold" :style="{ color: currentTheme.colors.text }">
                    Refund Policy
                </h1>
            </div>

            <!-- Content -->
            <div class="rounded-3xl p-8 mb-8" :style="{
                backgroundColor: currentTheme.colors.surface,
                border: `1px solid ${currentTheme.colors.border}`
            }">

                <p class="text-sm mb-6" :style="{ color: currentTheme.colors.textSecondary }">
                    Last updated: August 2026
                </p>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        This only applies to Premium
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Rocus's core product - unlimited saves, the full knowledge graph, local in-browser AI - is
                            free forever, so there's nothing to refund there. This policy covers the paid
                            <strong :style="{ color: currentTheme.colors.text }">Premium</strong> subscription only
                            (Cloud AI processing, billed monthly or annually - see
                            <a href="/pricing" class="underline"
                                :style="{ color: currentTheme.colors.primary }">Pricing</a>).</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        14-Day Money-Back Guarantee
                    </h2>
                    <div class="space-y-3" :style="{ color: currentTheme.colors.textSecondary }">
                        <p>If Premium isn't for you, request a full refund within <strong
                                :style="{ color: currentTheme.colors.text }">14 days</strong> of your first purchase,
                            no questions asked. Just email <strong
                                :style="{ color: currentTheme.colors.text }">info@rocus.io</strong> from the address
                            associated with your Rocus account, and we'll process it.</p>
                        <p>This guarantee applies to your <em>first</em> Premium purchase only. Renewal charges
                            (monthly or annual) after that aren't covered by the 14-day window - cancel before a
                            renewal date to avoid being charged for the next period.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        How Refunds Are Processed
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Payments for Rocus Premium are handled by <strong
                                :style="{ color: currentTheme.colors.text }">Lemon Squeezy</strong>, our Merchant of
                            Record. Once we approve a refund request, Lemon Squeezy issues it back to your original
                            payment method. Depending on your bank or card provider, it can take a few business days
                            to appear on your statement.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Cancelling vs. Refunding
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>You can cancel your Premium subscription anytime from your account settings. Cancelling
                            stops future renewals, and you'll keep Premium access through the end of the period
                            you've already paid for - it does not, by itself, refund that period. If you're within
                            your first 14 days and want your money back rather than just stopping future billing,
                            request a refund as described above instead of (or in addition to) cancelling.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        What Happens to Your Data
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Refunding or cancelling Premium only affects access to Cloud AI processing. Your knowledge
                            graph itself lives locally in your browser and is never deleted or touched by a
                            billing change - you keep everything, you just fall back to the free tier's local AI
                            processing.</p>
                    </div>
                </section>

                <section>
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Questions?
                    </h2>
                    <p :style="{ color: currentTheme.colors.textSecondary }">
                        Email <strong :style="{ color: currentTheme.colors.text }">info@rocus.io</strong> or open an
                        issue on
                        <a href="https://github.com/Othmanali02/Rocus/issues" target="_blank" class="underline"
                            :style="{ color: currentTheme.colors.primary }">
                            GitHub
                        </a>.
                    </p>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import themesData from "./themes/themes"
import { useSeoMeta } from "../composables/useSeoMeta";

const currentTheme = ref({
    id: 'default-light',
    name: 'Default Light',
    isDark: false,
    colors: {
        background: '#f4f4f4',
        surface: '#ffffff',
        primary: '#4A90E2',
        secondary: '#357ABD',
        accent: '#4A90E2',
        node: '#f4f4f4',
        nodeStroke: '#d1d5db',
        text: '#000000',
        textSecondary: '#6b7280',
        border: '#e5e7eb'
    }
});

function loadTheme() {
    const savedThemeId = localStorage.getItem('theme');
    if (savedThemeId) {
        const theme = themesData.find(t => t.id === savedThemeId);
        if (theme) {
            currentTheme.value = theme;
        }
    }
}

onMounted(() => {
    useSeoMeta({
        title: "Rocus Refund Policy",
        description: "Our refund policy for Rocus Premium - a 14-day money-back guarantee on your first purchase, processed through Lemon Squeezy.",
    });
    loadTheme();
});
</script>
