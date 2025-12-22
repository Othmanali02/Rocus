import { createRouter, createWebHistory } from "vue-router";
import { ref } from "vue";
import GraphNode from "@/components/GraphNode.vue";
import Landing from "../components/Landing.vue";
import { store } from "./store";
import PrivacyPolicy from "@/components/PrivacyPolicy.vue";

// var user = ref(null);

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "Home",
			component: Landing,
			// props: () => ({ user: store.user }),
		},
		{
			path: "/privacy",
			name: "PrivacyPolicy",
			component: PrivacyPolicy,
			// props: () => ({ user: store.user }),
		},
		{
			path: "/dashboard",
			name: "GraphNode",
			component: GraphNode,
			// props: () => ({ user: store.user }),
		},
		// {
		// 	path: "/redirect",
		// 	name: "Redirect",
		// 	component: Redirect,
		// 	props: () => ({ user: store.user }),
		// },
		// {
		// 	path: "/teams/:teamId",
		// 	name: "TeamDetails",
		// 	component: TeamDetails,
		// 	props: (route) => ({
		// 		user: store.user,
		// 		...route.params,
		// 	}),
		// },
	],
});

// router.beforeEach(async (to, from, next) => {
// 	if (to.path !== "/redirect" && !store.user) {
// 		try {
// 			// check the UUID too not just the token big bro
// 			const response = await axios.get("http://localhost:5000/auth/user-info", {
// 				withCredentials: true,
// 			});
// 			store.user = response.data;
// 			console.log(store.user.username);
// 		} catch (err) {
// 			if (err.status === 401) {
// 				console.log("login again");
// 				window.location.href = "http://localhost:5000/auth/login";
// 			} else if (err.status === 400) {
// 				console.log("dw about it twin, just login");
// 			} else {
// 				console.error("Error fetching user data:", err);
// 			}
// 		}
// 	}

// 	// if (to.path.includes("/lists/")) {
// 	// 	const listId = to.params.listId;
// 	// 	console.log("Checking access for list " + listId);

// 	// 	try {
// 	// 		const listResponse = await apiService.listStatus(listId);
// 	// 		console.log("Checking access for list " + listId);
// 	// 		console.log(listResponse.data);

// 	// 		// checks  if the user is either the owner or if the list is shared with them
// 	// 		if (!listResponse.data.isOwner && !listResponse.data.isMember) {
// 	// 			console.log("User is not authorized to view this list");
// 	// 			return next({ path: "/not-authorized" });
// 	// 		}
// 	// 	} catch (err) {
// 	// 		console.error("Error fetching list data:", err);
// 	// 		return next({ path: "/error" });
// 	// 	}
// 	// }

// 	next();
// });

export default router;
