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
                    Privacy Policy
                </h1>
            </div>

            <!-- Content -->
            <div class="rounded-3xl p-8 mb-8" :style="{
                backgroundColor: currentTheme.colors.surface,
                border: `1px solid ${currentTheme.colors.border}`
            }">

                <p class="text-sm mb-6" :style="{ color: currentTheme.colors.textSecondary }">
                    Last updated: December 2025
                </p>

                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Core Privacy Principles
                    </h2>
                    <div class="space-y-4" :style="{ color: currentTheme.colors.textSecondary }">
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">🔒</span>
                            <div>
                                <strong :style="{ color: currentTheme.colors.text }">Your Data Stays Local</strong>
                                <p>All your websites, clusters, embeddings, and AI processing happen entirely in your
                                    browser. We never see, store, or transmit your personal content.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">🚫</span>
                            <div>
                                <strong :style="{ color: currentTheme.colors.text }">No Fingerprinting</strong>
                                <p>We don't use device fingerprinting, tracking pixels, or any invasive tracking
                                    technologies.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">📊</span>
                            <div>
                                <strong :style="{ color: currentTheme.colors.text }">Anonymous Analytics Only</strong>
                                <p>If you consent, we collect only anonymized usage patterns to improve the product. No
                                    personal identifiers, ever.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <span class="text-2xl">🌐</span>
                            <div>
                                <strong :style="{ color: currentTheme.colors.text }">Open Source & Auditable</strong>
                                <p>Our code is public on GitHub. You can verify everything we say here by reading the
                                    source.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- What We Collect -->
                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        What We Collect (If You Consent)
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p class="mb-4">With your explicit consent, we collect anonymous analytics via Umami
                            (privacy-first, open-source analytics):</p>

                        <div class="p-4 rounded-xl mb-4" :style="{ backgroundColor: currentTheme.colors.background }">
                            <strong :style="{ color: currentTheme.colors.text }">✅ What We Collect:</strong>
                            <ul class="list-disc ml-6 mt-2 space-y-1">
                                <li>Page views (e.g., "someone visited the main graph page")</li>
                                <li>Button clicks (e.g., "theme button was clicked")</li>
                                <li>Feature usage (e.g., "cluster was exploded")</li>
                                <li>Error patterns (e.g., "search failed 3 times today")</li>
                                <li>Referrer source (e.g., "came from GitHub")</li>
                                <li>Browser type (e.g., "Chrome") and screen size</li>
                                <li>Country-level location (e.g., "United States") - derived from IP, not stored</li>
                            </ul>
                        </div>

                        <div class="p-4 rounded-xl" :style="{ backgroundColor: currentTheme.colors.background }">
                            <strong :style="{ color: currentTheme.colors.text }">❌ What We DON'T Collect:</strong>
                            <ul class="list-disc ml-6 mt-2 space-y-1">
                                <li>Your website URLs, titles, or content</li>
                                <li>Your cluster names or topics</li>
                                <li>Your search queries</li>
                                <li>Your IP address (not stored, only used momentarily for country detection)</li>
                                <li>Cookies or tracking identifiers</li>
                                <li>Browser fingerprints</li>
                                <li>Personal information of any kind</li>
                                <li>Cross-site tracking data</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- How We Use Data -->
                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        How We Use Analytics Data
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p class="mb-3">Analytics help us answer questions like:</p>
                        <ul class="list-disc ml-6 space-y-1">
                            <li>"Which features are most used?"</li>
                            <li>"Where do users get stuck?"</li>
                            <li>"What themes are popular?"</li>
                            <li>"Are there clustering errors we can fix?"</li>
                            <li>"What browsers need better support?"</li>
                        </ul>
                        <p class="mt-4"><strong :style="{ color: currentTheme.colors.text }">We never sell
                                data.</strong> We never share it with third parties. It exists solely to improve Rocus.
                        </p>
                    </div>
                </section>

                <!-- Your AI Data -->
                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Your AI Processing & Content
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p class="mb-3">Rocus runs AI models (Web-LLM, Transformers.js) entirely in your browser using
                            WebGPU. This means:</p>
                        <ul class="list-disc ml-6 space-y-1">
                            <li>Your website content never leaves your device</li>
                            <li>Summaries and embeddings are generated locally</li>
                            <li>No external AI APIs are called</li>
                            <li>Your knowledge graph is stored only in your browser's IndexedDB</li>
                        </ul>
                        <p class="mt-4">The only exception is the optional "Discover Similar Websites" feature, which
                            calls Google's Custom Search API through a privacy-preserving Cloudflare Worker (your IP is
                            hidden).</p>
                    </div>
                </section>

                <!-- Your Rights -->
                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Your Rights & Control
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <ul class="space-y-3">
                            <li><strong :style="{ color: currentTheme.colors.text }">Opt Out Anytime:</strong> Go to
                                Settings → Toggle "Help Improve Rocus"</li>
                            <li><strong :style="{ color: currentTheme.colors.text }">Do Not Track:</strong> We respect
                                the DNT browser header</li>
                            <li><strong :style="{ color: currentTheme.colors.text }">Export Your Data:</strong> Settings
                                → Export All Data (your clusters, websites, embeddings)</li>
                            <li><strong :style="{ color: currentTheme.colors.text }">Delete Your Data:</strong> Clear
                                your browser's IndexedDB or use Settings → Reset</li>
                            <li><strong :style="{ color: currentTheme.colors.text }">Review Our Code:</strong> <a
                                    href="https://github.com/Othmanali02/Rocus" target="_blank" class="underline"
                                    :style="{ color: currentTheme.colors.primary }">github.com/yourusername/rocus</a>
                            </li>
                        </ul>
                    </div>
                </section>

                <!-- Third-Party Services -->
                <section class="mb-8">
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Third-Party Services
                    </h2>
                    <div :style="{ color: currentTheme.colors.textSecondary }">
                        <p class="mb-3">Rocus uses these external services:</p>
                        <ul class="space-y-2">
                            <li>
                                <strong :style="{ color: currentTheme.colors.text }">Umami Analytics
                                    (userfeedback.rocus.io):</strong>
                                Self-hosted, GDPR-compliant analytics. No cookies, no personal data.
                            </li>
                            <li>
                                <strong :style="{ color: currentTheme.colors.text }">Google Custom Search API
                                    (optional):</strong>
                                Only used when you click "Discover Similar" on a cluster. Your IP is hidden by
                                Cloudflare Worker.
                            </li>
                            <li>
                                <strong :style="{ color: currentTheme.colors.text }">CDNs for AI Models:</strong>
                                Initial model downloads from HuggingFace/Xenova CDNs. Models are cached locally after
                                first download.
                            </li>
                        </ul>
                    </div>
                </section>

                <!-- Contact -->
                <section>
                    <h2 class="text-2xl font-bold mb-4" :style="{ color: currentTheme.colors.text }">
                        Questions?
                    </h2>
                    <p :style="{ color: currentTheme.colors.textSecondary }">
                        Have questions about privacy? Open an issue on
                        <a href="https://github.com/Othmanali02/Rocus/issues" target="_blank" class="underline"
                            :style="{ color: currentTheme.colors.primary }">
                            GitHub
                        </a> or email privacy@rocus.io
                    </p>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { inject } from 'vue';

const currentTheme = inject('currentTheme');
</script>