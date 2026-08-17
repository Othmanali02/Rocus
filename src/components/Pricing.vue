<script setup>
import { ref, computed, onMounted } from "vue";
import { store } from "../router/store";
import { useSeoMeta } from "../composables/useSeoMeta";
import { API_BASE } from "./constants/config";

onMounted(() => {
	useSeoMeta({
		title: "Rocus Pricing - Free & Premium Plans",
		description: "Rocus is free forever - unlimited saves, the full knowledge graph, and local AI processing. Upgrade to Premium for faster Cloud AI Processing with no daily limits.",
	});
});

const mobileMenuOpen = ref(false);
const billingCycle = ref("monthly"); // 'monthly' | 'annual'

const premiumPrice = computed(() => (billingCycle.value === "monthly" ? "8" : "80"));
const premiumPeriod = computed(() => (billingCycle.value === "monthly" ? "/month" : "/year"));

const signInUrl = `${API_BASE}/api/auth/login`;
</script>

<template>
    <div class="bg-[#f4f4f4] min-h-screen overflow-y-auto">
        <nav class="fixed w-full z-50 bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <a href="/" class="flex items-center space-x-3">
                        <img src="./images/RocusBlue.png" alt="Rocus" class="h-10" />
                    </a>
                    <div class="hidden md:flex items-center space-x-6">
                        <a href="/#features"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">Features</a>
                        <a href="/pricing" class="text-[#4A90E2] font-semibold">Pricing</a>
                        <a href="/#about"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">About</a>

                        <div v-if="store.user">
                            <a href="/dashboard"
                                class="px-5 py-2 text-[#4A90E2] capitalize border-2 border-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white transition-all font-semibold">
                                {{ store.user.name }}
                            </a>
                            <a :href="`${API_BASE}/api/auth/logout`"
                                class="px-5 py-2 mx-3 text-red-500 capitalize border-2 border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all font-semibold">
                                Logout
                            </a>
                        </div>
                        <a v-else :href="signInUrl"
                            class="px-5 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white transition-all font-semibold">
                            Sign In
                        </a>
                    </div>

                    <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden">
                        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div v-if="mobileMenuOpen" class="md:hidden bg-white border-t">
                <div class="px-4 py-3 space-y-3">
                    <a href="/#features" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">Features</a>
                    <a href="/pricing" class="block py-2 text-[#4A90E2] font-semibold">Pricing</a>
                    <a href="/#about" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">About</a>
                    <a v-if="!store.user" :href="signInUrl"
                        class="block w-full px-4 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg font-semibold text-center">
                        Sign In
                    </a>
                </div>
            </div>
        </nav>

        <section class="pt-40 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-[#4A90E2]/5 via-transparent to-[#4A90E2]/10"></div>

            <div class="max-w-5xl mx-auto relative">
                <div class="text-center max-w-2xl mx-auto mb-12">
                    <h1 class="text-4xl sm:text-5xl font-bold mb-4 text-[#1A1A1A]">
                        <span class="text-[#4A90E2]">Rocus </span>Premium
                    </h1>
                    <p class="text-lg sm:text-xl text-[#9A9A9A]">
                        Rocus is free and decentralized by default. Upgrade if you want
                        the faster and more accurate Cloud AI Processing with no daily limits.
                    </p>
                </div>

                <!-- Billing toggle -->
                <div class="flex items-center justify-center gap-3 mb-12">
                    <span :class="billingCycle === 'monthly' ? 'text-[#1A1A1A] font-semibold' : 'text-[#9A9A9A]'">
                        Monthly
                    </span>
                    <button @click="billingCycle = billingCycle === 'monthly' ? 'annual' : 'monthly'"
                        class="relative w-14 h-8 rounded-full bg-[#4A90E2] transition-colors" type="button"
                        aria-label="Toggle billing cycle">
                        <span
                            class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform"
                            :class="billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'"></span>
                    </button>
                    <span :class="billingCycle === 'annual' ? 'text-[#1A1A1A] font-semibold' : 'text-[#9A9A9A]'">
                        Annual
                    </span>
                    <span
                        class="ml-1 px-2 py-0.5 text-xs font-bold text-[#4A90E2] bg-[#4A90E2]/10 rounded-full border border-[#4A90E2]/20">
                        Two free months
                    </span>
                </div>

                <div class="grid md:grid-cols-2 gap-8 items-stretch">
                    <!-- Free tier -->
                    <div class="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent flex flex-col">
                        <h2 class="text-2xl font-bold text-[#1A1A1A] mb-1">Free</h2>
                        <p class="text-[#9A9A9A] mb-6">Decentralized &amp; open source</p>
                        <div class="mb-6">
                            <span class="text-5xl font-bold text-[#1A1A1A]">$0</span>
                            <span class="text-[#9A9A9A]"> / forever</span>
                        </div>

                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-start gap-3 text-[#1A1A1A]">
                                <svg class="w-5 h-5 text-[#4A90E2] flex-shrink-0 mt-0.5" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Unlimited saves &amp; the full knowledge graph</span>
                            </li>
                            <li class="flex items-start gap-3 text-[#1A1A1A]">
                                <svg class="w-5 h-5 text-[#4A90E2] flex-shrink-0 mt-0.5" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Local, in-browser AI processing &mdash; your data never leaves your device</span>
                            </li>
                            <li class="flex items-start gap-3 text-[#1A1A1A]">
                                <svg class="w-5 h-5 text-[#4A90E2] flex-shrink-0 mt-0.5" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Chrome extension quick-add</span>
                            </li>
                            <li class="flex items-start gap-3 text-[#1A1A1A]">
                                <svg class="w-5 h-5 text-[#4A90E2] flex-shrink-0 mt-0.5" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>A few free Cloud AI analyses to try, every day</span>
                            </li>
                        </ul>

                        <a href="/dashboard"
                            class="w-full text-center px-6 py-3 bg-white text-[#4A90E2] rounded-lg font-bold border-2 border-[#4A90E2] hover:bg-[#4A90E2]/5 transition-all">
                            Launch App
                        </a>
                    </div>

                    <!-- Premium tier -->
                    <div
                        class="relative bg-gradient-to-br from-[#4A90E2] to-[#6AB4F5] rounded-3xl p-8 shadow-2xl text-white flex flex-col">
                        <div
                            class="absolute -top-4 right-8 px-4 py-1 bg-[#1A1A1A] text-white text-xs font-bold rounded-full">
                            PREMIUM
                        </div>
                        <h2 class="text-2xl font-bold mb-1">Premium</h2>
                        <p class="opacity-90 mb-6">Cloud AI Processing, unlimited</p>
                        <div class="mb-6">
                            <span class="text-5xl font-bold">${{ premiumPrice }}</span>
                            <span class="opacity-90">{{ premiumPeriod }}</span>
                        </div>

                        <ul class="space-y-3 mb-8 flex-1">
                            <li class="flex items-start gap-3">
                                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Everything in Free</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Cloud AI Processing powered by Claude &mdash; faster, richer summaries and topic
                                    clustering</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>No daily caps &mdash; process as much as you want, anytime</span>
                            </li>
                        </ul>

                        <a :href="signInUrl"
                            class="w-full text-center px-6 py-3 bg-white text-[#4A90E2] rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg">
                            Get Premium
                        </a>
                    </div>
                </div>

                <p class="text-center text-sm text-[#9A9A9A] mt-10">
                    Questions about billing? Reach out on
                    <a href="https://github.com/Othmanali02/Rocus" target="_blank" rel="noopener noreferrer"
                        class="text-[#4A90E2] hover:underline">GitHub</a>.
                </p>
            </div>
        </section>

        <footer class="bg-[#1A1A1A] text-white py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-8">
                    <div class="flex items-center space-x-3">
                        <img src="./images/RocusWhite.png" alt="Rocus" class="h-10" />
                    </div>

                    <div>
                        <h4 class="font-bold mb-4 text-[#4A90E2]">Legal</h4>
                        <ul class="space-y-2 text-[#9A9A9A]">
                            <li>
                                <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
                            </li>
                            <li>
                                <a href="/refund-policy" class="hover:text-white transition-colors">Refund Policy</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-[#9A9A9A] border-opacity-20 pt-8 text-center text-[#9A9A9A]">
                    <p>© 2025 Rocus. Open source software licensed under MIT.</p>
                </div>
            </div>
        </footer>
    </div>
</template>
