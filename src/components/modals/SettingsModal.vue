<template>
    <div v-if="show" @click="$emit('close')"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
        <div @click.stop
            class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn max-h-[80vh] overflow-y-auto"
            :style="{
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border
            }">

            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">
                    Settings
                </h3>
                <button @click="$emit('close')" class="p-2 rounded-xl transition-all">
                    <svg class="w-6 h-6" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Settings Content -->
            <div class="space-y-6">
                <!-- Analytics Toggle -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium" :style="{ color: currentTheme.colors.text }">
                            Help Improve Rocus
                        </div>
                        <div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                            Anonymous usage analytics
                        </div>
                    </div>
                    <button @click="$emit('toggle-analytics')" class="relative w-14 h-8 rounded-full transition-all"
                        :class="analyticsConsent ? 'bg-[#4A90E2]' : 'bg-gray-300'">
                        <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
                            :class="{ 'translate-x-6': analyticsConsent }"></div>
                    </button>
                </div>

                <!-- Show Connections Toggle -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium" :style="{ color: currentTheme.colors.text }">
                            Show Connections
                        </div>
                        <div class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                            Display cluster links
                        </div>
                    </div>
                    <button @click="$emit('toggle-connections')" class="relative w-14 h-8 rounded-full transition-all"
                        :class="showConnections ? 'bg-[#4A90E2]' : 'bg-gray-300'">
                        <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200"
                            :class="{ 'translate-x-6': showConnections }"></div>
                    </button>
                </div>

                <div class="h-px" :style="{ backgroundColor: currentTheme.colors.border }"></div>

                <!-- Data Management -->
                <div class="space-y-4 pt-4">
                    <div class="font-medium" :style="{ color: currentTheme.colors.text }">
                        Data Management
                    </div>

                    <button @click="$emit('export-data')"
                        class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        :style="{
                            backgroundColor: currentTheme.colors.background,
                            color: currentTheme.colors.text,
                            border: `1px solid ${currentTheme.colors.border}`
                        }">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export All Data
                    </button>

                    <button @click="$emit('import-data')"
                        class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        :style="{
                            backgroundColor: currentTheme.colors.background,
                            color: currentTheme.colors.text,
                            border: `1px solid ${currentTheme.colors.border}`
                        }">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import Data
                    </button>
                </div>

                <div class="h-px" :style="{ backgroundColor: currentTheme.colors.border }"></div>

                <!-- AI Cache Management -->
                <div class="space-y-4 pt-4">
                    <div class="font-medium" :style="{ color: currentTheme.colors.text }">
                        AI Models & Cache
                    </div>

                    <button @click="$emit('clear-cache')"
                        class="w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        :style="{
                            backgroundColor: currentTheme.colors.background,
                            color: '#ef4444',
                            border: '1px solid #ef4444'
                        }">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear AI Model Cache
                    </button>

                    <p class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
                        If models fail to load or Chrome crashes, clear the cache and reload. This will re-download
                        models (~350MB).
                    </p>
                </div>
            </div>

            <!-- Reset Button -->
            <button @click="$emit('reset')" class="w-full mt-8 px-6 py-3 rounded-xl font-medium transition-all" :style="{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary
            }">
                Reset to Default
            </button>
        </div>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    analyticsConsent: { type: Boolean, default: false },
    showConnections: { type: Boolean, default: true }
});

defineEmits([
    'close',
    'toggle-analytics',
    'toggle-connections',
    'export-data',
    'import-data',
    'clear-cache',
    'reset'
]);
</script>