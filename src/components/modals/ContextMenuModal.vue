<template>
    <div v-if="show" @click.stop
        class="fixed z-[2500] rounded-xl shadow-2xl border overflow-hidden min-w-[200px] animate-scaleIn" :style="{
            ...position,
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border
        }">

        <button @click="$emit('rename')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :style="{ color: currentTheme.colors.text }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span class="text-sm font-medium">Rename Cluster</span>
        </button>

        <button @click="$emit('add-websites')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :style="{ color: currentTheme.colors.text }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm font-medium">Add Websites</span>
        </button>

        <button @click="$emit('remove-websites')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :style="{ color: currentTheme.colors.text }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="text-sm font-medium">Remove Websites</span>
        </button>

        <button @click="$emit('add-connection')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :style="{ color: currentTheme.colors.text }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="text-sm font-medium">Add Connection</span>
        </button>

        <button @click="$emit('remove-connection')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :style="{ color: currentTheme.colors.text }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" />
            </svg>
            <span class="text-sm font-medium">Remove Connection</span>
        </button>

        <div class="h-px mx-2" :style="{ backgroundColor: currentTheme.colors.border }"></div>

        <button @click="$emit('delete')"
            class="w-full flex items-center gap-3 px-4 py-3 transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span class="text-sm font-medium">Delete Cluster</span>
        </button>
    </div>
</template>

<script setup>
defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    position: {
        type: Object,
        default: () => ({ left: '0px', top: '0px' })
    }
});

defineEmits([
    'rename',
    'add-websites',
    'remove-websites',
    'add-connection',
    'remove-connection',
    'delete'
]);
</script>