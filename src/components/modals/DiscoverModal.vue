<template>
    <div v-if="show" @click="$emit('close')"
        class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div @click.stop
            class="rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto border"
            :style="{
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border
            }">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
                        Discover Similar Websites
                    </h3>
                    <p class="text-sm mt-1" :style="{ color: currentTheme.colors.textSecondary }">
                        Found {{ similarWebsites.length }} websites related to
                        <strong>{{ clusterTopic }}</strong>
                    </p>
                </div>

                <button @click="$emit('close')" class="p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
                <div class="w-12 h-12 border-4 border-t-[#4A90E2] rounded-full animate-spin mb-4"
                    :style="{ borderColor: currentTheme.colors.border, borderTopColor: currentTheme.colors.primary }">
                </div>

                <p :style="{ color: currentTheme.colors.textSecondary }">
                    Searching the web...
                </p>
            </div>

            <div v-else-if="similarWebsites.length > 0" class="space-y-3">
                <button v-for="(website, index) in similarWebsites" :key="index"
                    @click="$emit('open-link', website.url)"
                    class="w-full flex items-start gap-4 p-4 rounded-2xl transition-all group border" :style="{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border
                    }">
                    <div class="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-[#4A90E2]"
                        :style="{ backgroundColor: currentTheme.colors.surface }">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>

                    <div class="flex-1 min-w-0 text-left">
                        <h4 class="font-semibold truncate" :style="{ color: currentTheme.colors.text }">
                            {{ website.title }}
                        </h4>

                        <p class="text-xs mt-1 truncate text-[#4A90E2]">
                            {{ website.domain || new URL(website.url).hostname }}
                        </p>

                        <p class="text-sm mt-2 line-clamp-2" :style="{ color: currentTheme.colors.textSecondary }">
                            {{ website.snippet || website.description || "No description available" }}
                        </p>
                    </div>

                    <svg class="w-5 h-5 flex-shrink-0 transition-all group-hover:translate-x-1 group-hover:text-[#4A90E2]"
                        :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
            </div>

            <div v-else class="flex flex-col items-center justify-center py-16">
                <svg class="w-16 h-16 mb-4 opacity-50" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke-width="2"></circle>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35" />
                </svg>

                <p :style="{ color: currentTheme.colors.textSecondary }">
                    No similar websites found
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    clusterTopic: { type: String, default: '' },
    similarWebsites: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false }
});

defineEmits(['close', 'open-link']);
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>