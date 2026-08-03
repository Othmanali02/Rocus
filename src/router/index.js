import { createRouter, createWebHistory } from "vue-router";
import GraphNode from "@/components/GraphNode.vue";
import Landing from "../components/Landing.vue";
import Redirect from "../components/Redirect.vue";
import PrivacyPolicy from "@/components/PrivacyPolicy.vue";
import Pricing from "@/components/Pricing.vue";

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
			path: "/pricing",
			name: "Pricing",
			component: Pricing,
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
