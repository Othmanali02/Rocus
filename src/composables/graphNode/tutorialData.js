// Static step definitions for the onboarding tutorial overlay.
// Pure data only - see useTutorial.js for the reactive state/actions.

export const tutorialSteps = [
	{
		title: 'Welcome to Rocus',
		description: 'Rocus automatically organizes your saved websites into a living knowledge graph using AI. Let\'s walk through how it works - it only takes a minute.',
		highlight: null,
		action: null
	},
	{
		title: 'AI Processing: Cloud or Local',
		description: 'The gear icon opens Settings, where you can switch between Cloud AI (the default, ready instantly) and Local AI, which downloads a small model - roughly 300-700MB, so it can take a few minutes the first time - and then runs entirely in your browser, fully offline. The status icon next to it shows whether processing is ready; green means good to go.',
		highlight: 'settings-gear',
		action: null
	},
	{
		title: 'Save Websites With the Extension',
		description: 'The Rocus browser extension is how websites get into Rocus in the first place. Click its icon while browsing, pick an album (or just quick-save), and Rocus automatically clusters it with similar content. You can also jot a quick note or upload a file directly - both get organized into the same graph.',
		highlight: null,
		action: 'checkExtension'
	},
	{
		title: 'Organize With Albums',
		description: 'Albums group your clusters by topic, project, or however you like to organize things. Click here to switch between albums, browse your History by day, or view everything at once.',
		highlight: 'albums-dropdown',
		action: null
	},
	{
		title: 'How Clusters Work',
		description: 'Every circle on the graph is a cluster of similar websites - the bigger the circle, the more websites inside it. Related topics are drawn closer together, so the shape of the graph itself tells you something.',
		highlight: 'demo-cluster',
		action: 'showDemoCluster'
	},
	{
		title: 'Explore a Cluster',
		description: 'Click any cluster to open it up and see the individual websites inside. Give the highlighted one a try now.',
		highlight: 'demo-cluster',
		action: 'explodeDemoCluster'
	},
	{
		title: 'Share and Collaborate',
		description: 'Click the share icon on any album to get a link - anyone can view it instantly, no account needed. Invite people by email to let them add or edit content with you in real time, and see a colored dot on each item showing who added it.',
		highlight: 'share-button',
		action: null
	},
	{
		title: 'Make It Yours',
		description: 'Pick from 15+ color themes with the theme button - your choice is saved automatically. Use the search bar to instantly find any cluster or website, and right-click a cluster to rename it or add/remove websites. Explode any cluster to reveal a Discover node - one click surfaces similar sites you haven\'t found yet.',
		highlight: 'theme-button',
		action: null
	},
	{
		title: 'You\'re All Set',
		description: 'That\'s everything you need to know. Start saving websites with the extension and Rocus will keep organizing your knowledge graph as you go.',
		highlight: null,
		action: 'cleanup'
	}
];

// Alternate step sequence shown when the user has no clusters yet.
export const tutorialStepsEmpty = [
	{
		title: 'Welcome to Rocus',
		description: 'Rocus automatically organizes your saved websites into a living knowledge graph using AI. Let\'s walk through how it works - it only takes a minute.',
		highlight: null,
		action: null
	},
	{
		title: 'AI Processing: Cloud or Local',
		description: 'The gear icon opens Settings, where you can switch between Cloud AI (the default, ready instantly) and Local AI, which downloads a small model - roughly 300-700MB, so it can take a few minutes the first time - and then runs entirely in your browser, fully offline. The status icon next to it shows whether processing is ready; green means good to go.',
		highlight: 'settings-gear',
		action: null
	},
	{
		title: 'Save Websites With the Extension',
		description: 'The Rocus browser extension is how websites get into Rocus in the first place. Click its icon while browsing, pick an album (or just quick-save), and Rocus automatically clusters it with similar content. You can also jot a quick note or upload a file directly - both get organized into the same graph.',
		highlight: null,
		action: 'checkExtension'
	},
	{
		title: 'Organize With Albums',
		description: 'Albums group your clusters by topic, project, or however you like to organize things. Click here to switch between albums, browse your History by day, or create a new one.',
		highlight: 'albums-dropdown',
		action: null
	},
	{
		title: 'Your Graph Starts Here',
		description: 'Once you save a few websites, they\'ll appear here as clusters - similar sites automatically grouped together, with related topics drawn closer to each other.',
		highlight: 'graph-container',
		action: null
	},
	{
		title: 'Share and Collaborate',
		description: 'Once you have something worth sharing, click the share icon on any album to get a link - anyone can view it instantly, no account needed. Invite people by email to add or edit content with you in real time.',
		highlight: null,
		action: null
	},
	{
		title: 'Make It Yours',
		description: 'Pick from 15+ color themes with the theme button - your choice is saved automatically. Once you have content, use the search bar to instantly find any cluster or website, right-click a cluster to rename it or add/remove websites, and explode any cluster to reveal a Discover node for finding similar sites.',
		highlight: 'theme-button',
		action: null
	},
	{
		title: 'Get Started',
		description: 'Install the browser extension and save your first website - watch as Rocus builds your knowledge graph automatically.',
		highlight: null,
		action: null
	}
];
