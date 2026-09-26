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

export const versionHistory = [
	{
		version: 'v1.0.1',
		date: 'December 9th 2025',
		current: true,
		features: [
			'Creating manual connections between clusters',
			'More comprehensive search that goes through description, metadata, and AI summary',
		],
		improvements: [
			'More themes to choose from',
		],
		bugFixes: [

		]
	},
	{
		version: 'v1.0.0',
		date: 'December 7th 2025',
		current: false,
		features: [
			'AI-powered website clustering with local ML models',
			'Album organization system for managing clusters',
			'Theme picker with 15+ beautiful themes',
			'Real-time search and node highlighting',
			'Context menu for cluster operations (rename, delete, add/remove websites)',
			'Import/Export functionality for data backup',
			'Browser extension for quick website saving',
			'Similar website discovery using Google Search API',
		],
		improvements: [
			'Smooth node explosion/collapse animations',
			'Persistent dark mode and theme preferences',
			'Responsive graph layout with auto-centering',
			'IndexedDB for local data storage',
			'Album-based cluster isolation',
		],
		bugFixes: [
			'Fixed node positioning on graph edges',
			'Fixed theme consistency across interactions',
			'Fixed album update errors with IndexedDB',
			'Fixed search highlighting state management',
		]
	}
];

