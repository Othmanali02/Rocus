<template>
    <div v-if="show" @click="$emit('close')"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
        <div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border
        }">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
                    AI Model Status
                </h3>
                <button @click="$emit('close')" class="p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="space-y-4">
                <!-- Embedding Model -->
                <div class="p-4 rounded-xl" :style="{
                    backgroundColor: currentTheme.colors.background,
                    border: `1px solid ${currentTheme.colors.border}`
                }">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold" :style="{ color: currentTheme.colors.text }">
                            Embedding Model
                        </span>
                        <span v-if="embeddingModel" class="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
                            Loaded
                        </span>
                        <span v-else class="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
                            Not Loaded
                        </span>
                    </div>
                    <p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                        Xenova/all-MiniLM-L6-v2
                    </p>
                </div>

                <!-- Summarization Model -->
                <div class="p-4 rounded-xl" :style="{
                    backgroundColor: currentTheme.colors.background,
                    border: `1px solid ${currentTheme.colors.border}`
                }">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold" :style="{ color: currentTheme.colors.text }">
                            AI Model
                        </span>
                        <span v-if="summarizationModel" class="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
                            Loaded
                        </span>
                        <span v-else class="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">
                            Not Loaded
                        </span>
                    </div>
                    <p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                        Qwen2.5-0.5B (Self-hosted)
                    </p>
                </div>

                <!-- Processing Queue -->
                <div class="p-4 rounded-xl" :style="{
                    backgroundColor: currentTheme.colors.background,
                    border: `1px solid ${currentTheme.colors.border}`
                }">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold" :style="{ color: currentTheme.colors.text }">
                            Processing Queue
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs" :style="{
                            backgroundColor: processingQueue > 0 ? currentTheme.colors.primary + '20' : currentTheme.colors.background,
                            color: processingQueue > 0 ? currentTheme.colors.primary : currentTheme.colors.textSecondary
                        }">
                            {{ processingQueue }} items
                        </span>
                    </div>
                    <p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                        Websites waiting to be processed
                    </p>
                </div>

                <!-- Loading State -->
                <div v-if="modelLoading" class="p-4 rounded-xl" :style="{
                    backgroundColor: currentTheme.colors.primary + '10',
                    border: `1px solid ${currentTheme.colors.primary}40`
                }">
                    <p class="text-sm mb-2" :style="{ color: currentTheme.colors.text }">
                        {{ loadingMessage }}
                    </p>
                    <div class="w-full h-2 rounded-full overflow-hidden"
                        :style="{ backgroundColor: currentTheme.colors.border }">
                        <div class="h-full transition-all duration-300 rounded-full" :style="{
                            width: downloadProgress + '%',
                            backgroundColor: currentTheme.colors.primary
                        }"></div>
                    </div>
                </div>

                <!-- Error State -->
                <div v-if="error && !modelLoading" class="p-4 rounded-xl bg-red-500/10 border border-red-500/40">
                    <p class="text-sm font-semibold text-red-500 mb-2">
                        ⚠️ Error Loading Models
                    </p>
                    <p class="text-xs text-red-400">
                        {{ error }}
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 space-y-3">
                <button v-if="error" @click="$emit('retry')"
                    class="w-full px-6 py-3 rounded-xl font-medium transition-all" :style="{
                        backgroundColor: currentTheme.colors.primary,
                        color: '#ffffff'
                    }">
                    🔄 Retry Loading Models
                </button>

                <button @click="$emit('close')" class="w-full px-6 py-3 rounded-xl font-medium transition-all" :style="{
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.textSecondary
                }">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>
<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    embeddingModel: { type: Boolean, default: false },
    summarizationModel: { type: Boolean, default: false },
    processingQueue: { type: Number, default: 0 },
    modelLoading: { type: Boolean, default: false },
    loadingMessage: { type: String, default: '' },
    downloadProgress: { type: Number, default: 0 },
    error: { type: String, default: '' }
});

defineEmits(['close', 'retry']);
</script>