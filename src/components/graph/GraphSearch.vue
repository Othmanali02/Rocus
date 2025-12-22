<template>
    <div class="fixed top-24 left-1/2 transform -translate-x-1/2 transition-all duration-300"
        :class="{ 'scale-105': isSearchFocused }">
        <div @click="handleFocus"
            class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-text group"
            :style="{
                backgroundColor: isSearchFocused ? currentTheme.colors.surface : currentTheme.colors.background,
            }">

            <!-- Search Icon -->
            <svg class="w-5 h-5 transition-colors duration-200"
                :style="{ color: isSearchFocused ? currentTheme.colors.primary : currentTheme.colors.textSecondary }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <!-- Input -->
            <input ref="searchInputRef" v-model="searchInput" @input="$emit('search')" @focus="isSearchFocused = true"
                @blur="handleBlur" type="text" placeholder="Search clusters, websites, domains..."
                class="bg-transparent border-none focus:outline-none focus:ring-0 outline-none w-80 placeholder-gray-400 transition-all duration-200"
                :style="{ color: currentTheme.colors.text }" />

            <!-- Clear Button -->
            <button v-if="searchInput" @click="$emit('clear')"
                class="p-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                :style="{ color: currentTheme.colors.textSecondary }">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd" />
                </svg>
            </button>

            <!-- ESC Key Hint -->
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 flex-shrink-0 border"
                :style="{
                    backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: currentTheme.colors.border
                }">
                <span class="text-xs font-medium tracking-wider" :style="{ color: currentTheme.colors.textSecondary }">
                    ESC
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    currentTheme: { type: Object, required: true },
    searchInput: { type: String, default: '' },
    isSearchFocused: { type: Boolean, default: false }
});

const emit = defineEmits(['update:searchInput', 'update:isSearchFocused', 'search', 'clear', 'focus']);

const searchInputRef = ref(null);
const searchInput = ref(props.searchInput);
const isSearchFocused = ref(props.isSearchFocused);

function handleFocus() {
    emit('focus');
}

function handleBlur() {
    setTimeout(() => {
        if (searchInput.value === '') {
            isSearchFocused.value = false;
            emit('update:isSearchFocused', false);
        }
    }, 150);
}
</script>