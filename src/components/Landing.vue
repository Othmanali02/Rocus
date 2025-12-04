<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { store } from "../router/store";

const mobileMenuOpen = ref(false);
const scrolled = ref(false);
const isDarkMode = ref(false);


const handleScroll = () => {
    scrolled.value = window.scrollY > 150;
};

const props = defineProps({
    user: Object,
});

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
    console.log(store.user);
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
});

const installExtension = () => {
    window.open(
        "https://chrome.google.com/webstore/detail/your-extension-id",
        "_blank"
    );
};
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
                        <a href="#about"
                            class="text-[#1A1A1A] hover:text-[#4A90E2] transition-colors font-medium">About</a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
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
                            <a href="/profile"
                                class="px-5 py-2 text-[#4A90E2] capitalize border-2 border-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white transition-all font-semibold">
                                {{ store.user.username }}
                            </a>
                            <a v-if="store.user" href="http://localhost:5000/auth/logout"
                                class="px-5 py-2 mx-3 text-red-500 capitalize border-2 border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all font-semibold">
                                Logout
                            </a>
                        </div>

                        <a v-else href="http://localhost:5000/auth/login"
                            class="px-5 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white transition-all font-semibold">
                            Sign In
                        </a>
                        <a href="/dashboard"
                            class="px-5 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#3A7BC8] transition-all font-semibold shadow-lg shadow-[#4A90E2]/30">
                            Launch App
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
                    <a href="#about" class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">About</a>
                    <a href="https://github.com" target="_blank"
                        class="block py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">GitHub</a>
                    <button class="block w-full text-left py-2 text-[#1A1A1A] hover:text-[#4A90E2] font-medium">
                        Donate
                    </button>
                    <button class="w-full px-4 py-2 text-[#4A90E2] border-2 border-[#4A90E2] rounded-lg font-semibold">
                        Sign In
                    </button>
                    <button class="w-full px-4 py-2 bg-[#4A90E2] text-white rounded-lg font-semibold">
                        Launch App
                    </button>
                </div>
            </div>
        </nav>

        <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-[#4A90E2]/5 via-transparent to-[#4A90E2]/10"></div>

            <div class="max-w-7xl mx-auto relative">
                <div class="text-center max-w-4xl mx-auto mb-16">
                    <div
                        class="inline-flex items-center space-x-2 mb-6 px-4 py-2 bg-[#4A90E2]/10 rounded-full border border-[#4A90E2]/20">
                        <span class="text-[#4A90E2] font-bold text-sm">🔓 Free</span>
                        <span class="text-[#9A9A9A]">•</span>
                        <span class="text-[#4A90E2] font-bold text-sm">📖 Open Source</span>
                        <span class="text-[#9A9A9A]">•</span>
                        <span class="text-[#4A90E2] font-bold text-sm">💻 Decentralized</span>
                    </div>

                    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        Re-imagining<br />
                        <span class="bg-gradient-to-r from-[#4A90E2] to-[#6AB4F5] bg-clip-text text-transparent">
                            Bookmarks and History
                        </span>
                    </h1>

                    <p class="text-xl sm:text-2xl text-[#1A1A1A] mb-10 leading-relaxed">
                        Turn scattered links and searches into a
                        <span class="text-[#4A90E2] font-semibold">living map of knowledge</span>, instantly revealing
                        relationships that traditional bookmarks
                        can't show.
                    </p>

                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button @click="installExtension"
                            class="group px-8 py-4 bg-[#4A90E2] text-white rounded-lg text-lg font-bold hover:bg-[#3A7BC8] transition-all shadow-xl shadow-[#4A90E2]/30 hover:shadow-2xl hover:shadow-[#4A90E2]/40 flex items-center justify-center space-x-2">
                            <span>Get Started</span>
                            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                        <a href="https://github.com" target="_blank"
                            class="px-8 py-4 bg-white text-[#4A90E2] rounded-lg text-lg font-bold hover:bg-gray-50 transition-all border-2 border-[#4A90E2] flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span>View on GitHub</span>
                        </a>
                    </div>
                </div>

                <div class="relative max-w-5xl mx-auto">
                    <div class="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#4A90E2]/20">
                        <div class="relative h-96">
                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                <div
                                    class="w-20 h-20 bg-gradient-to-br from-[#4A90E2] to-[#6AB4F5] rounded-full shadow-lg flex items-center justify-center animate-pulse">
                                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>

                            <!-- Orbiting Nodes -->
                            <div v-for="(node, i) in 8" :key="i" :style="{
                                top: 50 + 35 * Math.sin((i * Math.PI) / 4) + '%',
                                left: 50 + 35 * Math.cos((i * Math.PI) / 4) + '%',
                                animationDelay: i * 0.2 + 's',
                            }" class="absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
                                <div
                                    class="w-12 h-12 bg-[#4A90E2]/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-[#4A90E2]/30">
                                    <div class="w-6 h-6 bg-[#4A90E2] rounded"></div>
                                </div>
                            </div>

                            <svg class="absolute inset-0 w-full h-full" style="z-index: 1">
                                <line v-for="i in 8" :key="'line-' + i" x1="50%" y1="50%"
                                    :x2="50 + 35 * Math.cos((i * Math.PI) / 4) + '%'"
                                    :y2="50 + 35 * Math.sin((i * Math.PI) / 4) + '%'" stroke="#4A90E2" stroke-width="2"
                                    stroke-opacity="0.3" stroke-dasharray="5,5">
                                    <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s"
                                        repeatCount="indefinite" />
                                </line>
                            </svg>
                        </div>
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
                                <button
                                    class="bg-white text-[#4A90E2] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg">
                                    Start Using Rocus
                                </button>
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

                <button
                    class="group px-10 py-5 bg-[#4A90E2] text-white rounded-lg text-xl font-bold hover:bg-[#3A7BC8] transition-all shadow-2xl shadow-[#4A90E2]/40 hover:shadow-[#4A90E2]/60 inline-flex items-center space-x-3">
                    <span>Get Started Now</span>
                    <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
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
                                <a href="#" class="hover:text-white transition-colors">Roadmap</a>
                            </li>
                            <li>
                                <a href="#" class="hover:text-white transition-colors">Documentation</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="font-bold mb-4 text-[#4A90E2]">Legal</h4>
                        <ul class="space-y-2 text-[#9A9A9A]">
                            <li>
                                <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="#" class="hover:text-white transition-colors">GDPR Compliance</a>
                            </li>
                            <li>
                                <a href="#" class="hover:text-white transition-colors">Cookie Policy</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="font-bold mb-4 text-[#4A90E2]">Community</h4>
                        <ul class="space-y-2 text-[#9A9A9A]">
                            <li>
                                <a href="https://github.com" target="_blank"
                                    class="hover:text-white transition-colors">GitHub</a>
                            </li>
                            <li>
                                <a href="#" class="hover:text-white transition-colors">Support</a>
                            </li>
                            <li>
                                <a href="#" class="hover:text-white transition-colors">Contact</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-[#9A9A9A] border-opacity-20 pt-8 text-center text-[#9A9A9A]">
                    <p>
                        © 2025 Rocus. Open source software licensed under MIT. Your data,
                        your control.
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