<script setup>

import { RouterView } from "vue-router";
import { onMounted } from "vue";
import axios from "axios";
import { store } from "./router/store";
import { API_BASE } from "./components/constants/config";

// Silent check only - failure just means "not signed in", never blocks or
// redirects (the app is free/open; signing in only unlocks Premium features).
onMounted(async () => {
	try {
		const { data } = await axios.get(`${API_BASE}/api/auth/user-info`, { withCredentials: true });
		store.user = data;
	} catch {
		store.user = null;
	} finally {
		store.authChecked = true;
	}
});

</script>

<template>
  <!-- :key forces a clean remount on every route change. Not currently
       load-bearing (no in-app navigation between routes that share a
       component uses router.push/<router-link> today - it's all plain <a
       href> hard navigations) but /dashboard and /shared/:graphId both
       render GraphNode.vue, and Vue Router reuses a component instance
       across a route change by default when the matched component is
       identical - which would skip onMounted's local-vs-shared branching
       entirely the moment any future in-app link does a soft navigation
       between them. Cheap insurance against a real bug one router.push away. -->
  <RouterView :key="$route.fullPath" />

</template>

<style></style>