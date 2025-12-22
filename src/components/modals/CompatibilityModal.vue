<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-fadeIn">
        <div class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn" :style="{
            backgroundColor: currentTheme.colors.surface,
            border: `2px solid ${results.overall === 'success' ? '#10b981' :
                results.overall === 'error' ? '#ef4444' : currentTheme.colors.border}`
        }">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
                <div>
                    <h3 class="text-2xl font-bold mb-2" :style="{ color: currentTheme.colors.text }">
                        System Compatibility Check
                    </h3>
                    <p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                        Verifying your browser can run Rocus AI models...
                    </p>
                </div>
                <div v-if="results.overall !== 'checking'"
                    class="w-12 h-12 rounded-full flex items-center justify-center" :style="{
                        backgroundColor: results.overall === 'success' ? '#10b98120' : '#ef444420'
                    }">
                    <svg v-if="results.overall === 'success'" class="w-7 h-7 text-green-500" fill="currentColor"
                        viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                </div>
            </div>

            <!-- Checks List -->
            <div class="space-y-3 mb-6">
                <!-- WebGPU Check -->
                <CheckItem :theme="currentTheme" :status="results.webgpu.status" :message="results.webgpu.message"
                    :fix="results.webgpu.fix" title="WebGPU Support (Critical)" />

                <!-- Memory Check -->
                <CheckItem :theme="currentTheme" :status="results.memory.status" :message="results.memory.message"
                    :fix="results.memory.fix" title="Available Memory" />

                <!-- IndexedDB Check -->
                <CheckItem :theme="currentTheme" :status="results.indexeddb.status" :message="results.indexeddb.message"
                    :fix="results.indexeddb.fix" title="Local Storage (IndexedDB)" />

                <!-- Cache API Check -->
                <CheckItem :theme="currentTheme" :status="results.cache.status" :message="results.cache.message"
                    :fix="results.cache.fix" title="Cache API (Model Storage)" />
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
                <button v-if="results.overall === 'success'" @click="$emit('continue')"
                    class="flex-1 px-6 py-3 rounded-xl font-medium transition-all bg-green-500 hover:bg-green-600 text-white">
                    ✓ Continue to Rocus
                </button>
                <button v-else-if="results.overall === 'error'" @click="$emit('continue-anyway')"
                    class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.text
                    }">
                    Continue Anyway (May Not Work)
                </button>
                <button @click="$emit('recheck')" class="px-6 py-3 rounded-xl font-medium transition-all" :style="{
                    backgroundColor: currentTheme.colors.primary,
                    color: '#fff'
                }">
                    🔄 Re-check
                </button>
            </div>

            <!-- Help Text -->
            <div v-if="results.overall === 'error'" class="mt-4 p-4 rounded-xl" :style="{
                backgroundColor: currentTheme.colors.background,
                border: `1px solid ${currentTheme.colors.border}`
            }">
                <div class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
                    ⚠️ Rocus may not work properly
                </div>
                <div class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
                    Critical checks failed. Rocus requires WebGPU for AI processing. Try:
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Using Chrome/Edge 113+ or Firefox Nightly</li>
                        <li>Opening in Incognito/Private mode</li>
                        <li>Enabling chrome://flags/#enable-unsafe-webgpu</li>
                        <li>Updating your GPU drivers</li>
                        <li>Checking browser console for specific errors</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    results: {
        type: Object,
        required: true,
        validator: (value) => {
            return value.webgpu && value.memory && value.indexeddb && value.cache && value.overall;
        }
    }
});

defineEmits(['continue', 'continue-anyway', 'recheck']);

// Sub-component for individual check items
const CheckItem = {
    props: {
        theme: Object,
        status: String,
        message: String,
        fix: String,
        title: String
    },
    template: `
        <div class="p-4 rounded-xl transition-all" :style="{
            backgroundColor: theme.colors.background,
            border: \`2px solid \${status === 'success' ? '#10b981' :
                status === 'error' ? '#ef4444' :
                status === 'warning' ? '#f59e0b' :
                theme.colors.border}\`
        }">
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                    <div v-if="status === 'checking'"
                        class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        :style="{ borderColor: theme.colors.primary }"></div>
                    <svg v-else-if="status === 'success'"
                        class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="status === 'warning'" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold mb-1" :style="{ color: theme.colors.text }">
                        {{ title }}
                    </div>
                    <div class="text-sm" :style="{ color: theme.colors.textSecondary }">
                        {{ message }}
                    </div>
                    <div v-if="fix" class="text-xs mt-2 px-3 py-2 rounded-lg"
                        :style="{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.primary
                        }">
                        💡 Fix: {{ fix }}
                    </div>
                </div>
            </div>
        </div>
    `
};
</script>