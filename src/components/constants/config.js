export const MODEL_CDN_BASE = 'https://models.rocus.io';
// Prod is reverse-proxied under rocus.io itself, so relative "/api/..." paths
// resolve correctly with no env var needed there - only dev (different origin
// from the :5173 frontend) needs VITE_ROCUS_API_BASE set.
export const API_BASE = import.meta.env.VITE_ROCUS_API_BASE || '';
export const AVAILABLE_MODELS = [/* paste the array content */];
export const SIMILARITY_THRESHOLD = 0.65;
export const LOOSE_SIMILARITY_THRESHOLD = 0.45;
export const GOOGLE_SEARCH_WORKER_URL = 'https://rocus.othman90hijawi.workers.dev';