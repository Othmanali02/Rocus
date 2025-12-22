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

