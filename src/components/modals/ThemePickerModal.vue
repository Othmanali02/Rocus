<template>
    <div v-if="show" @click="$emit('close')"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
        <div @click.stop
            class="border rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto"
            :style="{
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border
            }">

            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
                    Theme Picker
                </h3>
                <button @click="$emit('close')" class="p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-1 gap-3">
                <button v-for="theme in themes" :key="theme.id" @mouseenter="$emit('preview', theme)"
                    @click="$emit('apply', theme)"
                    class="group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all" :class="[
                        currentTheme.id === theme.id
                            ? 'border-[#4A90E2] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                    ]" :style="{
                        backgroundColor: currentTheme.id === theme.id ? 'rgba(74, 144, 226, 0.1)' : currentTheme.colors.background
                    }">

                    <div class="flex gap-2">
                        <div v-for="(color, index) in theme.preview" :key="index"
                            class="w-10 h-10 rounded-lg shadow-sm border border-black/10"
                            :style="{ backgroundColor: color }">
                        </div>
                    </div>

                    <div class="flex-1 text-left">
                        <div class="font-semibold" :style="{ color: currentTheme.colors.text }">
                            {{ theme.name }}
                        </div>
                        <div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                            {{ theme.description }}
                        </div>
                    </div>

                    <svg v-if="currentTheme.id === theme.id" class="w-6 h-6 text-[#4A90E2] flex-shrink-0"
                        fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    themes: { type: Array, required: true }
});

defineEmits(['close', 'preview', 'apply']);
</script>