/*
 * Copyright (C) 2025-2026 Rocus
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { createRouter, createWebHistory } from "vue-router";
import GraphNode from "@/components/GraphNode.vue";
import Landing from "../components/Landing.vue";
import Redirect from "../components/Redirect.vue";
import PrivacyPolicy from "@/components/PrivacyPolicy.vue";
import TermsOfService from "@/components/TermsOfService.vue";
import RefundPolicy from "@/components/RefundPolicy.vue";

// The dashboard itself is free/open to everyone (no sign-in wall) - signing
// in only unlocks the Premium Cloud AI toggle inside it. See usePremium.js.
const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "Home",
			component: Landing,
		},
		{
			path: "/privacy",
			name: "PrivacyPolicy",
			component: PrivacyPolicy,
		},
		{
			path: "/terms",
			name: "TermsOfService",
			component: TermsOfService,
		},
		{
			path: "/refund-policy",
			name: "RefundPolicy",
			component: RefundPolicy,
		},
		{
			path: "/dashboard",
			name: "GraphNode",
			component: GraphNode,
		},
		{
			// Same component as the normal dashboard - GraphNode.vue checks
			// route.params.graphId itself and sources data from the shared-graph
			// API instead of IndexedDB when present, reusing the entire D3
			// rendering/interaction layer (explode, website details, file
			// downloads, etc.) for guests and invited collaborators alike.
			path: "/shared/:graphId",
			name: "SharedGraph",
			component: GraphNode,
		},
		{
			path: "/redirect",
			name: "Redirect",
			component: Redirect,
		},
	],
});

export default router;
