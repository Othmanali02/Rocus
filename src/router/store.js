import { reactive } from "vue";

export const store = reactive({
  user: null,
  authChecked: false, // flips true once /api/auth/user-info has resolved (either way)
});
