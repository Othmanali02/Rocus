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
  <RouterView />

</template>

<style></style>