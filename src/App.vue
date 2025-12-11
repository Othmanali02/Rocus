<script setup>
import GraphNode from './components/GraphNode.vue'
import Landing from './components/Landing.vue';
import { RouterView } from "vue-router";
import { provide, ref } from 'vue';
import ConsentBanner from './components/ConsentBanner.vue';
import { useAnalytics } from './composables/useAnalytics';
import { inject } from 'vue';

const { checkConsent, setConsent } = useAnalytics();

const hasConsent = checkConsent();
if (hasConsent) {
  setConsent(true);
}

const currentTheme = inject('currentTheme');
provide('currentTheme', currentTheme);

</script>

<template>
  <RouterView />
  <ConsentBanner />
</template>

<style></style>