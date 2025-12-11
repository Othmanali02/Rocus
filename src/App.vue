<script setup>
import { RouterView } from "vue-router";
import ConsentBanner from './components/ConsentBanner.vue';
import { useAnalytics } from './composables/useAnalytics';

const { checkConsent, setConsent } = useAnalytics();

// Check consent on app load
const hasConsent = checkConsent();
if (hasConsent) {
  setConsent(true);
}
</script>

<template>
  <RouterView />
  <ConsentBanner />
</template>