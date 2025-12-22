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
                <div>
                    <h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
                        Version History
                    </h3>
                    <p class="text-sm mt-1" :style="{ color: currentTheme.colors.textSecondary }">
                        Current version: {{ currentVersion }} (Beta)
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

            <div class="space-y-6">
                <div v-for="version in versionHistory" :key="version.version" class="p-4 rounded-xl transition-all"
                    :style="{
                        backgroundColor: currentTheme.colors.background,
                        borderLeft: `4px solid ${currentTheme.colors.primary}`
                    }">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h4 class="text-lg font-bold" :style="{ color: currentTheme.colors.text }">
                                {{ version.version }}
                            </h4>
                            <p class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
                                {{ version.date }}
                            </p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" :style="{
                            backgroundColor: version.current ? currentTheme.colors.primary : currentTheme.colors.border,
                            color: version.current ? '#fff' : currentTheme.colors.textSecondary
                        }">
                            {{ version.current ? 'Current' : 'Previous' }}
                        </span>
                    </div>

                    <div v-if="version.features.length" class="mb-3">
                        <p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
                            Features
                        </p>
                        <ul class="space-y-1">
                            <li v-for="feature in version.features" :key="feature"
                                class="text-sm flex items-start gap-2"
                                :style="{ color: currentTheme.colors.textSecondary }">
                                <span class="text-green-500">•</span>
                                <span>{{ feature }}</span>
                            </li>
                        </ul>
                    </div>

                    <div v-if="version.improvements.length" class="mb-3">
                        <p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
                            Improvements
                        </p>
                        <ul class="space-y-1">
                            <li v-for="improvement in version.improvements" :key="improvement"
                                class="text-sm flex items-start gap-2"
                                :style="{ color: currentTheme.colors.textSecondary }">
                                <span class="text-blue-500">•</span>
                                <span>{{ improvement }}</span>
                            </li>
                        </ul>
                    </div>

                    <div v-if="version.bugFixes.length">
                        <p class="text-sm font-semibold mb-2" :style="{ color: currentTheme.colors.text }">
                            Bug Fixes
                        </p>
                        <ul class="space-y-1">
                            <li v-for="fix in version.bugFixes" :key="fix" class="text-sm flex items-start gap-2"
                                :style="{ color: currentTheme.colors.textSecondary }">
                                <span class="text-red-500">•</span>
                                <span>{{ fix }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    currentVersion: { type: String, default: 'v1.0.0' },
    versionHistory: { type: Array, required: true }
});

defineEmits(['close']);
</script>