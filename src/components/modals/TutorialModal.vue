<template>
    <div v-if="show" class="fixed inset-0 z-[3000]">
        <svg class="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
                <mask id="tutorial-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect v-if="highlightRect.width" :x="highlightRect.left - 8" :y="highlightRect.top - 8"
                        :width="highlightRect.width + 16" :height="highlightRect.height + 16" rx="12" fill="black" />
                </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="black" :opacity="0.85" mask="url(#tutorial-mask)" />
        </svg>

        <div v-if="highlightRect.width" class="absolute pointer-events-none transition-all duration-500 animate-pulse"
            :style="{
                top: `${highlightRect.top - 8}px`,
                left: `${highlightRect.left - 8}px`,
                width: `${highlightRect.width + 16}px`,
                height: `${highlightRect.height + 16}px`,
                border: `3px solid ${currentTheme.colors.primary}`,
                borderRadius: '12px',
                boxShadow: `0 0 0 4px ${currentTheme.colors.primary}40, 0 0 20px ${currentTheme.colors.primary}`
            }">
        </div>

        <!-- Tutorial Content Card -->
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
            :class="{ 'top-1/2 -translate-y-1/2 bottom-auto': !currentStep.highlight }">
            <div class="rounded-3xl p-6 max-w-xl w-[90vw] shadow-2xl animate-scaleIn" :style="{
                backgroundColor: currentTheme.colors.surface,
                border: `2px solid ${currentTheme.colors.primary}`
            }">

                <!-- Progress Bar -->
                <div class="mb-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-xs font-semibold" :style="{ color: currentTheme.colors.textSecondary }">
                            Step {{ step + 1 }} of {{ totalSteps }}
                        </span>
                        <span class="text-xs font-semibold" :style="{ color: currentTheme.colors.primary }">
                            {{ Math.round(((step + 1) / totalSteps) * 100) }}%
                        </span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden"
                        :style="{ backgroundColor: currentTheme.colors.border }">
                        <div class="h-full rounded-full transition-all duration-500" :style="{
                            width: `${((step + 1) / totalSteps) * 100}%`,
                            backgroundColor: currentTheme.colors.primary
                        }">
                        </div>
                    </div>
                </div>

                <!-- Step Title -->
                <h3 class="text-xl font-bold mb-3" :style="{ color: currentTheme.colors.text }">
                    {{ currentStep.title }}
                </h3>

                <!-- Step Description -->
                <p class="mb-6 leading-relaxed text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                    {{ currentStep.description }}
                </p>

                <!-- Navigation Buttons -->
                <div class="flex gap-3">
                    <button v-if="step > 0" @click="$emit('previous')"
                        class="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all text-sm" :style="{
                            backgroundColor: currentTheme.colors.background,
                            color: currentTheme.colors.textSecondary
                        }">
                        Previous
                    </button>
                    <button @click="$emit('next')"
                        class="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all text-sm" :style="{
                            backgroundColor: currentTheme.colors.primary,
                            color: '#fff'
                        }">
                        {{ step === totalSteps - 1 ? 'Finish' : 'Next' }}
                    </button>
                </div>

                <!-- Skip Button -->
                <button @click="$emit('skip')" class="w-full mt-3 text-xs transition-all hover:opacity-70"
                    :style="{ color: currentTheme.colors.textSecondary }">
                    Skip Tutorial
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    step: { type: Number, required: true },
    totalSteps: { type: Number, required: true },
    currentStep: { type: Object, required: true },
    highlightRect: { type: Object, default: () => ({ top: 0, left: 0, width: 0, height: 0 }) }
});

defineEmits(['next', 'previous', 'skip']);
</script>