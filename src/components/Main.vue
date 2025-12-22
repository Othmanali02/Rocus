<template>
    <div class="w-screen h-screen relative overflow-hidden font-sans transition-all duration-300"
        :style="{ backgroundColor: currentTheme.colors.background }">

        <!-- Header - You need to create this component -->
        <div class="fixed top-0 left-0 right-0 z-[1000] px-5 py-4"
            :style="{ backgroundColor: currentTheme.colors.background }">
            <div class="flex items-center justify-between max-w-screen-2xl mx-auto">
                <div class="flex items-center gap-4">
                    <a href="/" class="flex items-center">
                        <img v-if="currentTheme.isDark" src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
                        <img v-else src="./images/RocusBlue.png" alt="Rocus" class="h-10 w-auto" />
                    </a>
                </div>

                <!-- Albums Dropdown - Simplified inline -->
                <div class="flex-1 max-w-2xl mx-8">
                    <div class="relative">
                        <button @click.stop="showAlbumsDropdown = !showAlbumsDropdown"
                            class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all"
                            :style="{
                                backgroundColor: currentTheme.colors.surface,
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.textSecondary
                            }">
                            <div class="flex items-center gap-3">
                                <img v-if="currentAlbum?.icon" :src="getIconUrl(currentAlbum.icon)" alt="Album icon"
                                    class="w-8 h-8 object-contain" />
                                <img v-else src="./images/RocusFileIconColored.png" alt="Album icon"
                                    class="w-8 h-8 object-contain" />
                                <div class="text-left">
                                    <div class="text-sm font-medium" :style="{ color: currentTheme.colors.text }">
                                        {{ currentAlbum ? currentAlbum.name : 'All Clusters' }}
                                    </div>
                                </div>
                            </div>
                            <svg class="w-5 h-5" :class="{ 'rotate-180': showAlbumsDropdown }" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    <!-- Search Bar - Simplified inline -->
                    <div class="fixed top-24 left-1/2 transform -translate-x-1/2">
                        <div @click="isSearchFocused = true"
                            class="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-text" :style="{
                                backgroundColor: isSearchFocused ? currentTheme.colors.surface : currentTheme.colors.background,
                            }">
                            <svg class="w-5 h-5"
                                :style="{ color: isSearchFocused ? currentTheme.colors.primary : currentTheme.colors.textSecondary }"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input ref="searchInputRef" v-model="searchInput" @input="performSearch"
                                @focus="isSearchFocused = true" @blur="isSearchFocused = false" type="text"
                                placeholder="Search clusters, websites, domains..."
                                class="bg-transparent border-none focus:outline-none w-80"
                                :style="{ color: currentTheme.colors.text }" />
                            <button v-if="searchInput" @click="clearSearch" class="p-1.5 rounded-full">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-3">
                    <button @click="showThemes = !showThemes" class="p-2.5 rounded-xl transition-all"
                        :style="{ backgroundColor: currentTheme.colors.surface }">
                        <svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                    </button>

                    <button @click="showSettings = !showSettings" class="p-2.5 rounded-xl transition-all"
                        :style="{ backgroundColor: currentTheme.colors.surface }">
                        <svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <button @click="showModelStatus = !showModelStatus" class="p-2.5 rounded-xl transition-all"
                        :style="{ backgroundColor: currentTheme.colors.surface }">
                        <svg v-if="modelLoading" class="w-5 h-5 text-[#4A90E2] animate-spin" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <svg v-else class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Graph Canvas -->
        <div id="graph-container" ref="graphContainer" @click="handleBackgroundClick"
            class="w-full h-full pt-20 cursor-grab active:cursor-grabbing"></div>

        <!-- Floating Controls -->
        <div class="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3">
            <button @click="resetView" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border"
                :style="{ backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }">
                <svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
            </button>
            <button @click="refreshData" class="p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border"
                :style="{ backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }">
                <svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
            <button v-if="explodedNode" @click="collapseNode"
                class="p-4 bg-[#4A90E2] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Modals -->
        <AlbumModal v-if="showAlbumModal" :show="showAlbumModal" :currentTheme="currentTheme"
            :editingAlbum="editingAlbum" :iconOptions="iconOptions" :getIconUrl="getIconUrl"
            @close="showAlbumModal = false" @save="saveAlbum" />

        <ModelStatusModal v-if="showModelStatus" :show="showModelStatus" :currentTheme="currentTheme"
            :embeddingModel="!!embeddingModel" :summarizationModel="!!summarizationModel"
            :processingQueue="processingQueue.length" :modelLoading="modelLoading" :loadingMessage="loadingMessage"
            :downloadProgress="downloadProgress" :error="error" @close="showModelStatus = false" @retry="loadModels" />

        <SettingsModal v-if="showSettings" :show="showSettings" :currentTheme="currentTheme"
            :analyticsConsent="analyticsConsent" :showConnections="showConnections" @close="showSettings = false"
            @toggle-analytics="toggleAnalytics" @toggle-connections="showConnections = !showConnections"
            @export-data="exportAllData" @import-data="triggerImport" @clear-cache="clearModelCache"
            @reset="resetSettings" />

        <ThemePickerModal v-if="showThemes" :show="showThemes" :currentTheme="currentTheme" :themes="themes"
            @close="showThemes = false" @preview="previewTheme" @apply="applyTheme" />

        <DiscoverModal v-if="showDiscoverModal" :show="showDiscoverModal" :currentTheme="currentTheme"
            :clusterTopic="explodedNode?.topic || ''" :similarWebsites="similarWebsites" :isLoading="isLoadingSimilar"
            @close="showDiscoverModal = false" @open-link="openExternalLink" />

        <VersionHistoryModal v-if="showVersionHistory" :show="showVersionHistory" :currentTheme="currentTheme"
            currentVersion="v1.0.1" :versionHistory="versionHistory" @close="showVersionHistory = false" />

        <CompatibilityModal v-if="showCompatibilityCheck" :show="showCompatibilityCheck" :currentTheme="currentTheme"
            :results="compatibilityResults" @continue="showCompatibilityCheck = false"
            @continue-anyway="showCompatibilityCheck = false" @recheck="checkSystemCompatibility" />

        <ContextMenuModal v-if="showContextMenu" :show="showContextMenu" :currentTheme="currentTheme"
            :position="contextMenuStyle" @rename="renameCluster" @add-websites="showAddWebsitesModal"
            @remove-websites="showRemoveWebsitesModal" @add-connection="showAddConnectionModal"
            @remove-connection="showRemoveConnectionModal" @delete="deleteCluster" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as d3 from 'd3';
import { pipeline, env } from '@xenova/transformers';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { useAnalytics } from '../composables/useAnalytics';

import AlbumModal from './modals/AlbumModal.vue';
import ModelStatusModal from './modals/ModelStatusModal.vue';
import SettingsModal from './modals/SettingsModal.vue';
import ThemePickerModal from './modals/ThemePickerModal.vue';
import DiscoverModal from './modals/DiscoverModal.vue';
import VersionHistoryModal from './modals/VersionHistoryModal.vue';
import CompatibilityModal from './modals/CompatibilityModal.vue';
import ContextMenuModal from './modals/ContextMenuModal.vue';

import { themes } from './constants/themes';
import { versionHistory } from './constants/versionHistory';
import { iconOptions } from './constants/icons';

env.allowLocalModels = false;
env.useBrowserCache = true;

const { analyticsConsent, setConsent, trackEvent } = useAnalytics();

const currentTheme = ref(themes[0]);
const showThemes = ref(false);
const showSettings = ref(false);
const showModelStatus = ref(false);
const showAlbumModal = ref(false);
const showAlbumsDropdown = ref(false);
const showDiscoverModal = ref(false);
const showVersionHistory = ref(false);
const showCompatibilityCheck = ref(false);
const showContextMenu = ref(false);

const searchInput = ref('');
const isSearchFocused = ref(false);
const searchInputRef = ref(null);

const albums = ref({});
const currentAlbum = ref(null);
const editingAlbum = ref(null);

const clusters = ref({});
const websites = ref({});
const embeddings = ref({});
const graphData = ref({ nodes: [], links: [] });

const processingQueue = ref([]);
const modelLoading = ref(false);
const loadingMessage = ref('');
const downloadProgress = ref(0);
const error = ref('');

const explodedNode = ref(null);
const similarWebsites = ref([]);
const isLoadingSimilar = ref(false);
const showConnections = ref(true);

const contextMenuStyle = ref({});
const contextCluster = ref(null);

const compatibilityResults = ref({
    webgpu: { status: 'checking', message: '' },
    memory: { status: 'checking', message: '' },
    indexeddb: { status: 'checking', message: '' },
    cache: { status: 'checking', message: '' },
    overall: 'checking'
});

let embeddingModel = null;
let summarizationModel = null;
let db = null;
let simulation = null;
let svg = null;
let container = null;
let zoom = null;

const graphContainer = ref(null);

function getIconUrl(iconFileName) {
    if (!iconFileName) return '';
    if (iconFileName.startsWith('http') || iconFileName.startsWith('data:')) {
        return iconFileName;
    }
    return new URL(`./images/${iconFileName}`, import.meta.url).href;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function previewTheme(theme) {
    currentTheme.value = theme;
}

function applyTheme(theme) {
    currentTheme.value = theme;
    localStorage.setItem('theme', theme.id);
    showThemes.value = false;
}

function loadThemePreference() {
    const savedThemeId = localStorage.getItem('theme');
    if (savedThemeId) {
        const theme = themes.find(t => t.id === savedThemeId);
        if (theme) {
            currentTheme.value = theme;
        }
    }
}

function toggleAnalytics() {
    setConsent(!analyticsConsent.value);
}

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FunkyAIDB', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains('websites')) {
                database.createObjectStore('websites', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('clusters')) {
                database.createObjectStore('clusters', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('embeddings')) {
                database.createObjectStore('embeddings', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('albums')) {
                database.createObjectStore('albums', { keyPath: 'id' });
            }
        };
    });
}

async function loadModels() {
    modelLoading.value = true;
    try {
        embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        modelLoading.value = false;
        console.log('✅ Models loaded');
    } catch (err) {
        error.value = err.message;
        modelLoading.value = false;
    }
}

function performSearch() {
    console.log('Searching:', searchInput.value);
}

function clearSearch() {
    searchInput.value = '';
}

function resetView() {
    console.log('Reset view');
}

function refreshData() {
    console.log('Refresh data');
}

function collapseNode() {
    explodedNode.value = null;
}

function handleBackgroundClick() {
    showAlbumsDropdown.value = false;
    showContextMenu.value = false;
}

function saveAlbum(data) {
    console.log('Save album:', data);
    showAlbumModal.value = false;
}

function exportAllData() {
    console.log('Export data');
}

function triggerImport() {
    console.log('Import data');
}

function clearModelCache() {
    console.log('Clear cache');
}

function resetSettings() {
    console.log('Reset settings');
}

function openExternalLink(url) {
    window.open(url, '_blank');
}

function renameCluster() {
    console.log('Rename cluster');
}

function showAddWebsitesModal() {
    console.log('Add websites');
}

function showRemoveWebsitesModal() {
    console.log('Remove websites');
}

function showAddConnectionModal() {
    console.log('Add connection');
}

function showRemoveConnectionModal() {
    console.log('Remove connection');
}

function deleteCluster() {
    console.log('Delete cluster');
}

async function checkSystemCompatibility() {
    console.log('Checking compatibility');
    compatibilityResults.value.overall = 'success';
}

onMounted(async () => {
    try {
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClickOutside);

        platform.value = detectPlatform();

        console.log("Component mounted, initializing...");

        await initDB();
        loadThemePreference();
        console.log("✅ IndexedDB ready");

        await loadFromIndexedDB();

        initializeGraph();
        window.addEventListener("resize", handleResize);

        messageListener = setupMessageListener();
        console.log("✅ Message listener ready");

        const tutorialCompleted = localStorage.getItem('rocus-tutorial-completed');

        // Check system compatibility first
        const compatibilityCheckDone = localStorage.getItem('rocus-compatibility-checked');
        if (!compatibilityCheckDone) {
            showCompatibilityCheck.value = true;
            await checkSystemCompatibility();

            // Auto-close if all passed after 3 seconds
            if (compatibilityResults.value.overall === 'success') {
                setTimeout(() => {
                    showCompatibilityCheck.value = false;
                    localStorage.setItem('rocus-compatibility-checked', 'true');

                    // Start tutorial if not completed
                    if (!tutorialCompleted) {
                        setTimeout(() => {
                            if (graphData?.nodes?.length > 0) {
                                startTutorial();
                            } else {
                                startTutorialEmpty();
                            }
                        }, 500);
                    }
                }, 3000);
            }
        } else if (!tutorialCompleted) {
            // Skip straight to tutorial if compatibility already checked
            setTimeout(() => {
                if (graphData?.nodes?.length > 0) {
                    startTutorial();
                } else {
                    startTutorialEmpty();
                }
            }, 2000);
        }

        loadModels().catch(err => {
            console.error("Model loading failed (non-fatal):", err);
        });
    } catch (err) {
        error.value = `Initialization failed: ${err.message || err}`;
        console.error("❌ Init error:", err);
    }
});
onBeforeUnmount(() => {
    console.log('Component unmounting');
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
}

.animate-scaleIn {
    animation: scaleIn 0.2s ease-out;
}
</style>