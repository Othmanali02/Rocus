<script setup>
import { ref, onMounted } from 'vue';
import { useAnalytics } from '../composables/useAnalytics';
import themesData from "./themes/themes"

const { setConsent } = useAnalytics();
const showBanner = ref(false);

// Load theme from localStorage or use default
const currentTheme = ref({
  id: 'default-light',
  name: 'Default Light',
  isDark: false,
  colors: {
    background: '#f4f4f4',
    surface: '#ffffff',
    primary: '#4A90E2',
    secondary: '#357ABD',
    accent: '#4A90E2',
    node: '#f4f4f4',
    nodeStroke: '#d1d5db',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb'
  }
});

function loadTheme() {
  const savedThemeId = localStorage.getItem('theme');
  if (savedThemeId) {
    const theme = themesData.find(t => t.id === savedThemeId);
    if (theme) {
      currentTheme.value = theme;
    }
  }
}

onMounted(() => {
  // Load theme first
  loadTheme();
  
  // Check if user has already made a choice
  const consent = localStorage.getItem('rocus-analytics-consent');
  
  if (consent === null) {
    setTimeout(() => {
      showBanner.value = true;
    }, 1000);
  } else {
    console.log('Consent already set');
  }
});

function accept() {
  setConsent(true);
  showBanner.value = false;
}

function decline() {
  setConsent(false);
  showBanner.value = false;
}
</script>

<template>
  <div v-if="showBanner" class="fixed bottom-0 left-0 right-0 z-[9999] animate-slideInUp">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div class="rounded-2xl shadow-2xl border backdrop-blur-xl"
        :style="{
          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: currentTheme.colors.border
        }">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                :style="{ backgroundColor: currentTheme.colors.primary + '20' }">
                <svg class="w-6 h-6" :style="{ color: currentTheme.colors.primary }" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold mb-1" :style="{ color: currentTheme.colors.text }">
                Help Rocus Become Better
              </h3>
              <p class="text-sm" :style="{ color: currentTheme.colors.textSecondary }">
                We use privacy-first analytics to understand how Rocus is used. No personal data is collected, 
                and you can opt out anytime in settings. To learn more, please refer to our <a href="/privacy" :style="{ color: currentTheme.colors.text }">Privacy Policy</a>
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button @click="decline"
                class="px-6 py-2.5 rounded-xl font-medium transition-all text-sm"
                :style="{
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.textSecondary
                }">
                No Thanks
              </button>
              <button @click="accept"
                class="px-6 py-2.5 rounded-xl font-medium transition-all text-sm shadow-lg"
                :style="{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#fff'
                }">
                Accept & Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInUp {
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>