<template>
    <div v-if="show" @click="$emit('close')"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
        <div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border
        }">
            <h3 class="text-2xl font-bold mb-6" :style="{ color: currentTheme.colors.text }">
                {{ editingAlbum ? "Edit Album" : "Create New Album" }}
            </h3>

            <div class="space-y-5">
                <div>
                    <label class="block text-sm font-medium mb-2" :style="{ color: currentTheme.colors.textSecondary }">
                        Album Name
                    </label>
                    <input v-model="albumName" type="text" placeholder="My Collection"
                        class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none transition-all"
                        :style="{
                            backgroundColor: currentTheme.colors.background,
                            borderColor: currentTheme.colors.border,
                            color: currentTheme.colors.text
                        }" />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2" :style="{ color: currentTheme.colors.textSecondary }">
                        Icon
                    </label>
                    <div class="flex gap-2">
                        <button v-for="(icon, index) in iconOptions" :key="icon" @click="selectedIcon = icon"
                            class="p-3 rounded-xl transition-all" :class="{
                                'bg-[#4A90E2]/20 ring-2 ring-[#4A90E2]': selectedIcon === icon,
                            }">
                            <img :src="getIconUrl(icon)" alt="icon" class="w-8 h-8 object-contain" />
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex gap-3 mt-8">
                <button @click="$emit('close')" class="flex-1 px-6 py-3 rounded-xl font-medium transition-all" :style="{
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.textSecondary
                }">
                    Cancel
                </button>
                <button @click="handleSave"
                    class="flex-1 px-6 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#357ABD] transition-all shadow-lg shadow-[#4A90E2]/30">
                    {{ editingAlbum ? "Save" : "Create" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    show: { type: Boolean, required: true },
    currentTheme: { type: Object, required: true },
    editingAlbum: { type: Object, default: null },
    iconOptions: { type: Array, required: true },
    getIconUrl: { type: Function, required: true }
});

const emit = defineEmits(['close', 'save']);

const albumName = ref('');
const selectedIcon = ref(props.iconOptions[0]);

watch(() => props.editingAlbum, (newVal) => {
    if (newVal) {
        albumName.value = newVal.name;
        selectedIcon.value = newVal.icon;
    } else {
        albumName.value = '';
        selectedIcon.value = props.iconOptions[0];
    }
}, { immediate: true });

function handleSave() {
    if (!albumName.value.trim()) return;
    emit('save', { name: albumName.value.trim(), icon: selectedIcon.value });
}
</script>