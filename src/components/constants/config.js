/*
 * Copyright (C) 2025-2026 Othman Ali
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

export const MODEL_CDN_BASE = 'https://models.rocus.io';
// Prod is reverse-proxied under rocus.io itself, so relative "/api/..." paths
// resolve correctly with no env var needed there - only dev (different origin
// from the :5173 frontend) needs VITE_ROCUS_API_BASE set.
export const API_BASE = import.meta.env.VITE_ROCUS_API_BASE || '';
export const AVAILABLE_MODELS = [/* paste the array content */];
export const SIMILARITY_THRESHOLD = 0.65;
export const LOOSE_SIMILARITY_THRESHOLD = 0.45;
export const GOOGLE_SEARCH_WORKER_URL = 'https://rocus.othman90hijawi.workers.dev';