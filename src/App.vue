<!--
Copyright (C) 2025-2026 Rocus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with this program. If not, see
<https://www.gnu.org/licenses/>.
-->
<script setup>

import { RouterView } from "vue-router";
import { onMounted } from "vue";
import axios from "axios";
import { store } from "./router/store";
import { API_BASE } from "./components/constants/config";
import { ensureHydrated } from "./composables/graphNode/useGraphEngine";
import { setupMessageListener } from "./composables/graphNode/useAIModels";
import { checkReturnTriggers } from "./composables/graphNode/useReturnTriggers";

// The browser extension reuses whatever rocus.io tab is already open,
// regardless of route (findRocusTab() in rocus-extension matches any
// rocus.io/* tab) - so the message listener that turns its postMessage into
// a saved website needs to be live for the tab's entire lifetime, not just
// while GraphNode.vue (the /dashboard or /shared/:graphId route) happens to
// be mounted.
//
// Registered here at top-level script-setup, NOT inside onMounted: this is
// the root component (only ever instantiated once per tab), and
// setupMessageListener() is just a synchronous window.addEventListener call
// with no async prerequisite of its own - attaching it immediately, before
// anything else even starts loading, closes a real (if narrow) window where
// GraphNode.vue's own onMounted (a child, which Vue mounts before this
// parent's onMounted runs) could otherwise finish rendering /dashboard
// before any listener existed to catch a fast quick-save.
//
// The actual danger isn't here anymore, though - it's centralized inside
// saveToIndexedDB() itself (useGraphEngine.js), which now awaits
// ensureHydrated() as its own first line before touching any IndexedDB
// store. That's what actually prevents the data-loss failure mode (a save
// running against an unhydrated in-memory snapshot), regardless of exactly
// when a message arrives relative to any of this - kicking off
// ensureHydrated() here too is just a head start, not the safety mechanism.
setupMessageListener();
ensureHydrated()
	.then(() => checkReturnTriggers())
	.catch((err) => console.error("Hydration failed:", err));

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