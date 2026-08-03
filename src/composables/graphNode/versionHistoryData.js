// Static changelog shown in the "Version History" modal.

export const versionHistory = [
	{
		version: 'v1.2.0',
		date: 'August 3rd 2026',
		current: true,
		features: [
			'Real-time collaborative graph sharing — invite collaborators with view or edit access, or share a public view-only link',
			'"Added by" attribution badges show who on a shared graph added each website or note',
			'Live presence indicators show where collaborators are looking on a shared graph',
		],
		improvements: [
			'Smarter quick-add routing while viewing a shared graph',
			'Cleaner sharing panel — fixed duplicate popups, a missing routing toggle, share icon visibility, collaborator avatar initials, and graph title display',
			'Clear upgrade prompts when free-tier sharing limits (shared graph count, collaborator seats) are reached',
			'Shared graphs now merge simultaneous edits from multiple collaborators instead of one overwriting another\'s changes',
			'File downloads now work reliably for collaborators and guests on shared graphs',
			'Shared-graph rendering, history browsing, and view recentering fixes',
		],
		bugFixes: [
			'Fixed a privilege-escalation bug and two identity-leak issues found during a full security audit of the sharing system',
			'Fixed shared-graph connections not always disconnecting cleanly when leaving a page or when a graph expires or is deleted',
			'Fixed a rare data-loss bug where two collaborators adding different websites to the same cluster at nearly the same time could cause one addition to be silently dropped',
		]
	},
	{
		version: 'v1.1.0',
		date: 'July 25th 2026',
		current: false,
		features: [
			'Cloud AI Processing powered by Claude — everyone gets a free daily taste, Premium unlocks unlimited use',
		],
		improvements: [
			'Faster first load — the system compatibility check only runs when you actually use local processing',
			'The status icon in the header now shows "ready" immediately instead of a loading flash',
		],
		bugFixes: [
			'Fixed the compatibility check modal appearing for Cloud Processing users who never touch the local model',
		]
	},
	{
		version: 'v1.0.1',
		date: 'December 9th 2025',
		current: false,
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
