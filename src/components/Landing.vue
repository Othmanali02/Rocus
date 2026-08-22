<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { store } from "../router/store";
import { useAnalytics } from '../composables/useAnalytics';
import { useSeoMeta } from '../composables/useSeoMeta';
import { API_BASE } from './constants/config';
import HeroGraphAnimation from './HeroGraphAnimation.vue';

const { loadUmamiUnconditional, trackEventUnconditional } = useAnalytics();

const mobileMenuOpen = ref(false);
const scrolled = ref(false);
const isDarkMode = ref(false);

// Simple contact form - spotted-a-bug/reach-out, sent to info@rocus.io via
// the existing Resend-backed mailer (rocusnodejs/mailer.js).
const contactForm = ref({ name: "", email: "", message: "" });
const contactBusy = ref(false);
const contactStatus = ref(""); // "" | "sent" | "error"

async function submitContactForm() {
	if (!contactForm.value.name.trim() || !contactForm.value.email.trim() || !contactForm.value.message.trim()) return;
	contactBusy.value = true;
	contactStatus.value = "";
	try {
		const res = await fetch(`${API_BASE}/api/contact`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(contactForm.value),
		});
		if (!res.ok) throw new Error("failed");
		contactStatus.value = "sent";
		contactForm.value = { name: "", email: "", message: "" };
	} catch {
		contactStatus.value = "error";
	} finally {
		contactBusy.value = false;
	}
}

const props = defineProps({ user: Object });

// Hero headline A/B variants -------------------------------------------------
// A random variant is picked fresh on every page load (below), so which one
// shows changes almost every visit. ?v=3 forces a specific variant (0-based)
// instead, for QA/demoing a particular one without relying on chance.
const heroVariants = [
    {
        headline: ["You find it. You lose it.", "Never again."],
        subheadline: "Rocus quietly organizes everything you save, so the thing you found three weeks ago is one search away.",
    },
    {
        headline: ["Stop re-Googling", "things you already found."],
        subheadline: "Every page, note, and file you save becomes instantly searchable — organized automatically, kept private on your device.",
    },
    {
        headline: ["Your bookmarks are where", "good research goes to die."],
        subheadline: "Rocus turns the pile you never revisit into a living, searchable map of everything you know.",
    },
    {
        headline: ["Never lose", "a source again."],
        subheadline: "Save it once and Rocus files it into a searchable knowledge graph for you — no folders, no tagging, no digging.",
    },
    {
        headline: ["The end of", "“where the hell did I see that?”"],
        subheadline: "Rocus remembers every page and file you save and resurfaces it the moment you need it.",
    },
    {
        headline: ["Everything you've ever saved,", "finally findable."],
        subheadline: "Rocus organizes your links, notes, and files into one searchable graph — automatically, and entirely on your device.",
    },
    {
        headline: ["You saved it.", "Rocus knows exactly where."],
        subheadline: "Your research organizes itself into a searchable map while you read — private by default, powerful when you want it.",
    },
    {
        headline: ["Your research, organized", "while you're still reading."],
        subheadline: "Rocus clusters every page and note you save in real time, so your knowledge builds itself as you work.",
    },
    {
        headline: ["Turn everything you save into", "a memory you can search."],
        subheadline: "Links, PDFs, notes — Rocus weaves them into one private, searchable knowledge graph you actually come back to.",
    },
    {
        headline: ["Remember everything", "you find online."],
        subheadline: "Rocus saves, organizes, and resurfaces every page and file — automatically, privately, in one searchable map.",
    },
];

function pickHeroVariantIndex() {
    // URLSearchParams.get() returns null (not undefined) when ?v is absent,
    // and Number(null) is 0, not NaN - checking for null explicitly first
    // avoids every param-less visit silently "forcing" variant 0.
    const raw = new URLSearchParams(window.location.search).get('v');
    if (raw !== null) {
        const forced = Number(raw);
        if (Number.isInteger(forced) && forced >= 0 && forced < heroVariants.length) {
            return forced; // manual override for QA/demos, e.g. ?v=4
        }
    }
    return Math.floor(Math.random() * heroVariants.length); // fresh pick each visit
}

const HERO_VARIANT_INDEX = pickHeroVariantIndex();
const heroVariant = heroVariants[HERO_VARIANT_INDEX] ?? heroVariants[0];

// Headlines vary a lot in length across variants ("Never lose" vs "Turn
// everything you save into"), and the two lines are hard-split with a <br/>
// so each one has to fit on a single physical line at desktop/laptop widths
// or the "2 line" hero breaks. Guessing a font-size from character counts is
// unreliable (real glyph widths vary by letter/font), so this measures the
// actual rendered text with Canvas 2D (same font/weight the h1 uses) and
// picks the largest size, up to the original 72px design ceiling, that
// still fits both lines - shrinking only the variants that need it. Below
// 1024px the inline override is cleared entirely; mobile/tablet just wraps
// normally via the existing responsive Tailwind classes.
const heroH1 = ref(null);
const HERO_FONT_MAX_PX = 92;
const HERO_FONT_MIN_PX = 36;
let heroFitCanvasCtx = null;

function fitHeroHeadline() {
    const el = heroH1.value;
    if (!el) return;

    if (window.innerWidth < 1024) {
        el.style.fontSize = "";
        return;
    }

    const containerWidth = el.clientWidth;
    if (!containerWidth) return;

    if (!heroFitCanvasCtx) {
        heroFitCanvasCtx = document.createElement("canvas").getContext("2d");
    }
    if (!heroFitCanvasCtx) return; // unsupported - leave Tailwind's static sizing in place

    const computedStyle = window.getComputedStyle(el);
    heroFitCanvasCtx.font = `${computedStyle.fontWeight} ${HERO_FONT_MAX_PX}px ${computedStyle.fontFamily}`;
    const longestLineWidth = Math.max(
        heroFitCanvasCtx.measureText(heroVariant.headline[0]).width,
        heroFitCanvasCtx.measureText(heroVariant.headline[1]).width
    );

    let fontSize = HERO_FONT_MAX_PX;
    if (longestLineWidth > containerWidth) {
        // Text width scales linearly with font-size for a fixed font/weight,
        // so this solves for the exact fit in one step instead of guessing -
        // 0.97 leaves a small safety margin for sub-pixel/kerning rounding.
        fontSize = Math.max(HERO_FONT_MIN_PX, Math.floor(HERO_FONT_MAX_PX * (containerWidth / longestLineWidth) * 0.97));
    }
    el.style.fontSize = `${fontSize}px`;
}

let heroFitResizeTimer = null;
const handleHeroFitResize = () => {
    clearTimeout(heroFitResizeTimer);
    heroFitResizeTimer = setTimeout(fitHeroHeadline, 100);
};

onMounted(() => {
    requestAnimationFrame(fitHeroHeadline); // wait a frame so layout/width is settled
    if (document.fonts?.ready) {
        document.fonts.ready.then(fitHeroHeadline); // re-measure once the real webfont has swapped in
    }
    window.addEventListener("resize", handleHeroFitResize);
});

onUnmounted(() => {
    window.removeEventListener("resize", handleHeroFitResize);
    clearTimeout(heroFitResizeTimer);
});

let maxScrollDepth = 0;
const milestonesTracked = new Set();

const handleScroll = () => {
    scrolled.value = window.scrollY > 150;

    // Scroll depth tracking
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    [25, 50, 75, 100].forEach((milestone) => {
        if (scrollPercent >= milestone && !milestonesTracked.has(milestone)) {
            trackEventUnconditional('scroll-depth', { depth: milestone + '%' });
            milestonesTracked.add(milestone);
        }
    });
};

const installExtension = () => {
    trackEventUnconditional('install-extension-clicked', { source: 'landing-page', variant: HERO_VARIANT_INDEX });

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    const url = isFirefox
        ? "https://addons.mozilla.org/en-US/firefox/addon/rocus/"
        : "https://chromewebstore.google.com/detail/rocus/ekhebfoaaokmbhieckfkpapfkiicpbma";

    window.open(url, "_blank");
};

// Track landing page view and time on page - basic anonymous visit stats
// (page view, referrer, time on page), unconditional for every visitor. See
// the "Landing Page Visit Analytics" section in PrivacyPolicy.vue: this is
// distinct from the in-app usage tracking the Settings "Help Improve Rocus"
// toggle gates, which remains fully opt-in.
const trackLandingPage = () => {
    trackEventUnconditional('landing-page-view', { referrer: document.referrer || 'direct' });
    trackEventUnconditional('hero-variant-shown', { variant: HERO_VARIANT_INDEX, headline: heroVariant.headline.join(' ') });

    const startTime = Date.now();
    const trackTimeOnPage = () => {
        const seconds = Math.round((Date.now() - startTime) / 1000);
        trackEventUnconditional('time-on-landing-page', { seconds });
    };

    window.addEventListener('beforeunload', trackTimeOnPage);
    onUnmounted(() => {
        window.removeEventListener('beforeunload', trackTimeOnPage);
        trackTimeOnPage(); // final event
    });
};

onMounted(() => {
    useSeoMeta({
        title: "Rocus - AI Knowledge Graph & Collaborative Bookmark Manager",
        description: "Turn saved websites, notes, and files into a living, AI-organized knowledge graph. Collaborate in real time, browse your history by day, and stay private with local, in-browser AI.",
    });

    window.addEventListener("scroll", handleScroll);

    console.log(store.user);

    loadUmamiUnconditional();
    trackLandingPage();
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
});
</script>



<template>
    <div class="bg-[#f4f4f4] min-h-screen overflow-y-auto">
        <nav :class="[
            'fixed w-full z-50 transition-all duration-300',
            scrolled ? 'bg-white shadow-lg' : 'bg-white/80 backdrop-blur-sm',
        ]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center space-x-3">
                        <img src="./images/RocusBlue.png" alt="Rocus" class="h-10" />
                    </div>
                    <div class="hidden md:flex items-center space-x-6">
                        <a href="#features"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">Features</a>
                        <a href="/pricing"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">Pricing</a>
                        <a href="#about"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">About</a>
                        <a href="https://github.com/Othmanali02/Rocus" target="_blank" rel="noopener noreferrer"
                            class="flex items-center space-x-2 text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span>GitHub</span>
                        </a>
                        <!-- <button
                            class="flex items-center space-x-2 text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Donate</span>
                        </button> -->
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

                        <a v-else :href="`${API_BASE}/api/auth/login`"
                            class="px-5 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white transition-all font-semibold">
                            Sign In
                        </a>

                        <a @click="installExtension"
                            class="px-5 py-2 cursor-pointer bg-[#4A90E2] text-white rounded-lg hover:bg-[#3A7BC8] transition-all font-semibold shadow-lg shadow-[#4A90E2]/30">
                            Install Extension
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
                    <a href="#features" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">Features</a>
                    <a href="/pricing" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">Pricing</a>
                    <a href="#about" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">About</a>
                    <a href="https://github.com/Othmanali02/Rocus" target="_blank"
                        class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">GitHub</a>
                    <!-- <button class="block w-full text-left py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">
                        Donate
                    </button> -->
                    <a v-if="!store.user" :href="`${API_BASE}/api/auth/login`"
                        class="block w-full px-4 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg font-semibold text-center">
                        Sign In
                    </a>
                    <a @click="installExtension"
                        class="block w-full px-4 py-2 cursor-pointer bg-[#4A90E2] text-white rounded-lg font-semibold text-center">
                        Install Extension
                    </a>
                </div>
            </div>
        </nav>

        <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden lg:min-h-screen lg:flex lg:items-center">
            <div class="absolute inset-0 bg-gradient-to-br from-[#4A90E2]/5 via-transparent to-[#4A90E2]/10"></div>

            <div class="w-full max-w-[1600px] mx-auto relative">
                <div class="grid lg:grid-cols-[1fr_1.15fr] gap-12 xl:gap-16 items-center">
                    <div class="text-center lg:text-left">
                        <div
                            class="inline-flex items-center space-x-2 mb-6 px-4 py-2 bg-[#4A90E2]/10 rounded-full border border-[#4A90E2]/20">
                            <span class="text-[#4A90E2] font-bold text-sm">Free</span>
                            <span class="text-[#9A9A9A]">•</span>
                            <span class="text-[#4A90E2] font-bold text-sm">Open Source</span>
                            <span class="text-[#9A9A9A]">•</span>
                            <span class="text-[#4A90E2] font-bold text-sm">Private by default</span>
                        </div>

                        <h1 ref="heroH1" class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            {{ heroVariant.headline[0] }}<br />
                            <span class="bg-gradient-to-r from-[#4A90E2] to-[#6AB4F5] bg-clip-text text-transparent">
                                {{ heroVariant.headline[1] }}
                            </span>
                        </h1>

                        <p class="text-xl sm:text-2xl lg:text-3xl text-[#1A1A1A] mb-10 leading-relaxed">
                            {{ heroVariant.subheadline }}
                        </p>

                        <div class="flex justify-center lg:justify-start">
                            <a href="/dashboard"
                                @click="trackEventUnconditional('launch-app-clicked', { source: 'landing-page', variant: HERO_VARIANT_INDEX })"
                                class="group px-8 py-4 lg:px-10 lg:py-5 bg-[#4A90E2] text-white rounded-lg text-lg lg:text-xl font-bold hover:bg-[#3A7BC8] transition-all shadow-xl shadow-[#4A90E2]/30 hover:shadow-2xl hover:shadow-[#4A90E2]/40 flex items-center justify-center space-x-2">
                                <span>Try Rocus</span>
                                <svg class="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div class="relative">
                        <div class="absolute -inset-10 bg-[#4A90E2]/20 blur-3xl rounded-full -z-10"></div>
                        <HeroGraphAnimation />
                    </div>
                </div>
            </div>
        </section>

        <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-[#1A1A1A]">
                        Why <span class="text-[#4A90E2]">Rocus</span>?
                    </h2>
                    <p class="text-xl text-[#9A9A9A] max-w-2xl mx-auto">
                        Three powerful reasons to transform how you organize your digital
                        life
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div
                        class="group bg-gradient-to-br from-[#4A90E2]/5 to-transparent rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">
                            Single Knowledge Map
                        </h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            It turns scattered links and searches into a single, living map of
                            knowledge, instantly showing relationships Google or bookmarks or
                            tab grouping can't.
                        </p>
                    </div>

                    <div
                        class="group bg-gradient-to-br from-[#4A90E2]/5 to-transparent rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">
                            Zero Mental Load
                        </h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Automatically clusters, labels, and connects all content, so users
                            never dig through tabs, bookmarks, or repeated searches again.
                        </p>
                    </div>

                    <div
                        class="group bg-gradient-to-br from-[#4A90E2]/5 to-transparent rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">
                            Hidden Connections
                        </h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Recommends related links, hidden connections, and trending content
                            based on the user's own map, revealing information they wouldn't
                            discover with standard search.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f4f4]">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-[#1A1A1A]">
                        One Graph, <span class="text-[#4A90E2]">Every Feature You Need</span>
                    </h2>
                    <p class="text-xl text-[#9A9A9A] max-w-2xl mx-auto">
                        From your first saved link to a fully collaborative research hub - Rocus
                        grows with how you work.
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 00-9.288 0M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">Real-Time Collaboration</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Share any album with a live link. Invite collaborators, watch every
                            change sync instantly, and see who's online - no more sending
                            screenshots of your research.
                        </p>
                    </div>

                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">Notes That Cluster Themselves</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Jot down a thought and Rocus automatically connects it to the right
                            topic in your graph - or drops it in a shared Notes hub if nothing
                            matches yet.
                        </p>
                    </div>

                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">Save Any File, Not Just Links</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Upload PDFs and documents alongside your web saves. Rocus extracts
                            and organizes them into the same knowledge graph - no manual sorting
                            required.
                        </p>
                    </div>

                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">One-Click Browser Extension</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Save any page in a single click from Chrome or Firefox. Pick an
                            album, or let quick-add sort it into your graph automatically.
                        </p>
                    </div>

                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">Discover Similar Websites</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            One click surfaces related pages and resources you haven't found
                            yet, powered by the connections already in your own graph.
                        </p>
                    </div>

                    <div
                        class="group bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-transparent hover:border-[#4A90E2]/30">
                        <div
                            class="w-16 h-16 bg-[#4A90E2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#4A90E2]/30">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 15a4 4 0 004 4h9a5 5 0 001.7-9.7 5 5 0 00-9.6-2.2A4 4 0 003 15z" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-[#1A1A1A]">Local or Cloud AI - Your Call</h3>
                        <p class="text-[#9A9A9A] leading-relaxed">
                            Run the AI entirely in your browser for full privacy, or switch to
                            faster cloud processing when you need it. Either way, your graph
                            stays yours.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#f4f4f4]">
            <div class="max-w-7xl mx-auto">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 class="text-4xl sm:text-5xl font-bold mb-6 text-[#1A1A1A]">
                            Built for <span class="text-[#4A90E2]">Privacy</span> &
                            <span class="text-[#4A90E2]">Freedom</span>
                        </h2>
                        <p class="text-xl text-[#9A9A9A] mb-8">
                            Your data stays yours. Open source, Local processing, and fully
                            transparent.
                        </p>

                        <div class="space-y-6">
                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-[#4A90E2] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold mb-2 text-[#1A1A1A]">
                                        Complete Data Control
                                    </h3>
                                    <p class="text-[#9A9A9A]">
                                        Your browsing data never leaves your device.
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-[#4A90E2] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold mb-2 text-[#1A1A1A]">
                                        Open Source Transparency
                                    </h3>
                                    <p class="text-[#9A9A9A]">
                                        Review our code on GitHub and verify our privacy promises.
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-[#4A90E2] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold mb-2 text-[#1A1A1A]">
                                        Decentralized
                                    </h3>
                                    <p class="text-[#9A9A9A]">
                                        Browser-based AI model that runs completely on your device.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="relative">
                        <div
                            class="bg-gradient-to-br from-[#4A90E2] to-[#6AB4F5] rounded-2xl p-12 text-white shadow-2xl">
                            <div class="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div class="relative">
                                <h3 class="text-4xl font-bold mb-4">Decentralized AI</h3>
                                <p class="text-xl mb-8 opacity-90">
                                    Rocus is a browser-based AI that runs entirely on your device.
                                    Your data stays private, no servers involved, and you stay in
                                    full control.
                                    <span class="underline">Fast, Safe, and Decentralized.</span>
                                </p>
                                <div class="flex flex-col sm:flex-row gap-4">
                                    <a href="/dashboard"
                                        class="inline-block bg-white text-[#4A90E2] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg text-center">
                                        Start Using Rocus
                                    </a>
                                    <a href="https://github.com/Othmanali02/Rocus" target="_blank"
                                        class="inline-flex items-center justify-center space-x-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-all">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path
                                                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span>View on GitHub</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f4f4]">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-4xl sm:text-5xl font-bold mb-6 text-[#1A1A1A]">
                    Ready to revolutionize your bookmarks?
                </h2>

                <!-- <button
                    class="group px-10 py-5 bg-[#4A90E2] text-white rounded-lg text-xl font-bold hover:bg-[#3A7BC8] transition-all shadow-2xl shadow-[#4A90E2]/40 hover:shadow-[#4A90E2]/60 inline-flex items-center space-x-3">
                    <span>Get Started Now</span>
                    <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button> -->
            </div>
        </section>

        <section class="py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f4f4]">
            <div class="max-w-lg mx-auto text-center">
                <h2 class="text-3xl font-bold text-[#1A1A1A] mb-2">Get in touch</h2>
                <p class="text-[#9A9A9A] mb-8">Want to say hi? We read every message.</p>

                <form @submit.prevent="submitContactForm" class="space-y-4 text-left">
                    <input v-model="contactForm.name" type="text" required placeholder="Your name"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2]" />
                    <input v-model="contactForm.email" type="email" required placeholder="you@example.com"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2]" />
                    <textarea v-model="contactForm.message" required rows="4" placeholder="What's on your mind?"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none"></textarea>

                    <button type="submit" :disabled="contactBusy"
                        class="w-full px-6 py-3 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#3a7bc8] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                        {{ contactBusy ? "Sending…" : "Send message" }}
                    </button>

                    <p v-if="contactStatus === 'sent'" class="text-center text-sm text-emerald-600 font-medium">
                        Thanks - we'll get back to you soon.
                    </p>
                    <p v-if="contactStatus === 'error'" class="text-center text-sm text-red-500 font-medium">
                        Something went wrong - try again, or email info@rocus.io directly.
                    </p>
                </form>
            </div>
        </section>

        <footer class="bg-[#1A1A1A] text-white py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
                <div class="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div class="flex items-center space-x-3 mb-4">
                            <img src="./images/RocusWhite.png" alt="Rocus" class="h-10" />
                        </div>
                        <p class="text-[#9A9A9A]">
                            Re-imagining how you organize and discover knowledge on the web.
                        </p>
                    </div>

                    <div>
                        <h4 class="font-bold mb-4 text-[#4A90E2]">Product</h4>
                        <ul class="space-y-2 text-[#9A9A9A]">
                            <li>
                                <a href="#features" class="hover:text-white transition-colors">Features</a>
                            </li>

                            <li>
                                <a href="/pricing" class="hover:text-white transition-colors">Pricing</a>
                            </li>

                            <li>
                                <a href="https://github.com/Othmanali02/Rocus/blob/main/README.md"
                                    class="hover:text-white transition-colors">Documentation</a>
                            </li>
                        </ul>
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

                    <div>
                        <h4 class="font-bold mb-4 text-[#4A90E2]">Community</h4>
                        <ul class="space-y-2 text-[#9A9A9A]">
                            <li>
                                <a href="https://github.com/Othmanali02/Rocus" target="_blank"
                                    class="hover:text-white transition-colors">GitHub</a>
                            </li>

                        </ul>
                    </div>
                </div>

                <div class="border-t border-[#9A9A9A] border-opacity-20 pt-8 text-center text-[#9A9A9A]">
                    <p>
                        © 2025 Rocus. Open source software licensed under MIT.
                    </p>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
@keyframes bounce {

    0%,
    100% {
        transform: translate(-50%, -50%) translateY(0);
    }

    50% {
        transform: translate(-50%, -50%) translateY(-10px);
    }
}

.animate-bounce {
    animation: bounce 3s ease-in-out infinite;
}
</style>