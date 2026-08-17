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
                    Terms of Service
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
                        Agreement to Terms
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>By using Rocus - the browser extension, the web app at this domain, or the Chrome/Firefox
                            extensions - you agree to these Terms of Service. If you don't agree, please don't use
                            Rocus.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        The Service
                    </h2>
                    <div class="space-y-3" :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Rocus is a knowledge-graph tool that turns the websites, files, and notes you save into a
                            connected, explorable graph. It comes in two tiers:</p>
                        <ul class="list-disc ml-6 space-y-1">
                            <li><strong :style="{ color: currentTheme.colors.text }">Free</strong> - unlimited saves,
                                the full knowledge graph, and local, in-browser AI processing, forever, at no cost.
                            </li>
                            <li><strong :style="{ color: currentTheme.colors.text }">Premium</strong> - a paid
                                subscription that adds faster Cloud AI processing (powered by Claude) with no daily
                                limits. See <a href="/pricing" class="underline"
                                    :style="{ color: currentTheme.colors.primary }">Pricing</a> for current
                                rates.</li>
                        </ul>
                        <p>We may add, change, or remove features over time. We'll try not to make things worse for
                            you without warning.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Your Account
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>The core Rocus experience needs no account - your graph lives in your browser's local
                            storage. Signing in is only required to unlock Premium Cloud AI processing. You're
                            responsible for keeping your account credentials secure and for any activity that happens
                            under your account.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Acceptable Use
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p class="mb-3">Please don't use Rocus to:</p>
                        <ul class="list-disc ml-6 space-y-1">
                            <li>Break the law, or infringe someone else's rights</li>
                            <li>Attempt to disrupt, overload, or gain unauthorized access to our infrastructure or
                                other users' data</li>
                            <li>Reverse-engineer or abuse the Cloud AI processing service (e.g. to extract or resell
                                access to the underlying model)</li>
                            <li>Upload or process content you don't have the right to process</li>
                        </ul>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Your Content & Data
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>You own whatever you save into Rocus - your websites, files, notes, and the graph you
                            build from them. As described in our
                            <a href="/privacy" class="underline"
                                :style="{ color: currentTheme.colors.primary }">Privacy Policy</a>, this
                            data stays on your device by default; the only exception is content you explicitly send
                            through the optional Cloud AI processing feature, which is used solely to generate your
                            results and is not used to train models or shared with third parties beyond what's
                            needed to serve that request.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Premium Subscriptions & Billing
                    </h2>
                    <div class="space-y-3" :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Premium is billed monthly or annually, in advance. Payments are processed by <strong
                                :style="{ color: currentTheme.colors.text }">Lemon Squeezy</strong>, our Merchant of
                            Record - Lemon Squeezy, not Rocus, handles your payment details, receipts, and applicable
                            sales tax/VAT for the transaction.</p>
                        <p>Your subscription renews automatically at the end of each billing period until you cancel.
                            You can cancel anytime from your account settings; cancelling stops future renewals but
                            doesn't refund the current period (see our
                            <a href="/refund-policy" class="underline"
                                :style="{ color: currentTheme.colors.primary }">Refund Policy</a> for
                            purchase refunds).</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Intellectual Property
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Rocus's source code is open source and MIT-licensed - see our <a
                                href="https://github.com/Othmanali02/Rocus" target="_blank" class="underline"
                                :style="{ color: currentTheme.colors.primary }">GitHub repository</a> for the license
                            terms. The Rocus name, logo, and branding are not covered by that license and remain the
                            property of their owner.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Disclaimers & Limitation of Liability
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>Rocus is provided "as is," without warranties of any kind, express or implied. We don't
                            guarantee the service will be uninterrupted, error-free, or fit for any particular
                            purpose. To the fullest extent permitted by law, Rocus and its operator aren't liable for
                            any indirect, incidental, or consequential damages arising from your use of the service.
                            Because your data lives locally in your browser by default, we strongly encourage using
                            Settings → Export Data periodically as your own backup.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Changes to These Terms
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>We may update these Terms from time to time. If we make material changes, we'll update
                            the "Last updated" date above. Continuing to use Rocus after changes take effect means
                            you accept the updated Terms.</p>
                    </div>
                </section>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Governing Law
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p>These Terms are governed by the laws applicable to Rocus's place of operation, without
                            regard to conflict-of-law principles.</p>
                    </div>
                </section>

                <section>
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Questions?
                    </h2>
                    <p :style="{ color: currentTheme.colors.textSecondary }">
                        Reach out on
                        <a href="https://github.com/Othmanali02/Rocus/issues" target="_blank" class="underline"
                            :style="{ color: currentTheme.colors.primary }">
                            GitHub
                        </a> or email info@rocus.io
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
        title: "Rocus Terms of Service",
        description: "The terms governing your use of Rocus - the free and Premium knowledge graph tool for organizing and discovering what you save on the web.",
    });
    loadTheme();
});
</script>
