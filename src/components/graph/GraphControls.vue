<template>
    <div class="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
        <!-- Reset View -->
        <button @click="$emit('reset-view')"
            class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group" :style="{
                backgroundColor: currentTheme.colors.background,
                borderColor: currentTheme.colors.border
            }">
            <svg class="w-5 h-5 group-hover:text-[#4A90E2] transition-colors"
                :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
        </button>

        <!-- Refresh -->
        <button @click="$emit('refresh')" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border group"
            :style="{
                backgroundColor: currentTheme.colors.background,
                borderColor: currentTheme.colors.border
            }">
            <svg class="w-5 h-5 group-hover:text-[#4A90E2] transition-colors"
                :style="{ color: currentTheme.colors.textSecondary }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>

        <!-- Collapse (only show when exploded) -->
        <button v-if="explodedNode" @click="$emit('collapse')"
            class="p-4 bg-[#4A90E2] text-white rounded-2xl shadow-lg hover:shadow-xl hover:bg-[#357ABD] transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
</template>

<script setup>
defineProps({
    currentTheme: { type: Object, required: true },
    explodedNode: { type: Object, default: null }
});

defineEmits(['reset-view', 'refresh', 'collapse']);
</script>