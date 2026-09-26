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

// Minimal per-route SEO - this app is a client-rendered SPA with no SSR/
// prerendering and no head-management library, so every route otherwise
// shares the exact same <title>/description from index.html. Google's own
// crawler executes JS and reads the resulting DOM, so setting these in
// onMounted is enough for search indexing.
//
// What this does NOT fix: non-JS crawlers (social link-unfurlers - Twitter,
// Slack, Discord, etc.) only ever see index.html's static tags, never these
// per-route ones - a real, unavoidable limitation of CSR without SSR, not
// something a client-side composable can work around.
export function useSeoMeta({ title, description }) {
	if (title) document.title = title;
	if (description) {
		let tag = document.querySelector('meta[name="description"]');
		if (!tag) {
			tag = document.createElement("meta");
			tag.setAttribute("name", "description");
			document.head.appendChild(tag);
		}
		tag.setAttribute("content", description);
	}
}
