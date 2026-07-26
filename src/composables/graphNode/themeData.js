// Static theme catalogue for the graph page's theme picker.
// Pure data only - no logic. See useThemes.js for the reactive state/actions.

export const themes = [
	{
		id: 'default-light',
		name: 'Rocus Light',
		description: 'Clean and minimal',
		isDark: false,
		preview: ['#f4f4f4', '#4A90E2', '#ffffff', '#e5e7eb'],
		colors: {
			background: '#f4f4f4',
			surface: '#ffffff',
			primary: '#4A90E2',
			secondary: '#357ABD',
			accent: '#4A90E2',
			node: '#f4f4f4',
			nodeStroke: '#d1d5db',
			text: '#000000',
			textSecondary: '#6b7280',
			border: '#e5e7eb'
		}
	},
	{
		id: 'default-dark',
		name: 'Rocus Dark',
		description: 'Easy on the eyes',
		isDark: true,
		preview: ['#212121', '#374151', '#4A90E2', '#1f2937'],
		colors: {
			background: '#212121',
			surface: '#000000',
			primary: '#4A90E2',
			secondary: '#357ABD',
			accent: '#4A90E2',
			node: '#374151',
			nodeStroke: '#4b5563',
			text: '#ffffff',
			textSecondary: '#9ca3af',
			border: '#374151'
		}
	},
	{
		id: 'hangle',
		name: 'Hangle',
		description: 'https://hangle-geo.com',
		isDark: false,
		preview: ['#8fca5c', '#3ab3da', '#854f2b', '#ffffff'],
		colors: {
			background: '#8fca5c',
			surface: '#3ab3da',
			primary: '#854f2b',
			secondary: '#ffffff',
			accent: '#3ab3da',
			node: '#ffffff',
			nodeStroke: '#854f2b',
			text: '#ffffff',
			textSecondary: '#ffffff',
			border: '#854f2b'
		}
	},
	{
		id: 'scramble',
		name: 'Anagram Scramble',
		description: 'https://anagram-scramble.com',
		isDark: false,
		preview: ['#013b3f', '#ffae42', '#ffffe5', '#4d7cc3'],
		colors: {
			background: '#013b3f',
			surface: '#4d7cc3',
			primary: '#ffae42',
			secondary: '#ffffe5',
			accent: '#ffae42',
			node: '#ffffe5',
			nodeStroke: '#4d7cc3',
			text: '#ffffe5',
			textSecondary: '#ffae42',
			border: '#4d7cc3'
		}
	},
	{
		id: 'base-model-white-f150',
		name: 'Base Model White 2008 4.6L F150 Supercrew',
		description: 'Lé Truck',
		isDark: false,
		preview: ['#F8F9FA', '#003478', '#FFFFFF', '#C0C0C0'],
		colors: {
			background: '#F8F9FA',
			surface: '#FFFFFF',
			primary: '#003478',
			secondary: '#0066CC',
			accent: '#C0C0C0',
			node: '#FFFFFF',
			nodeStroke: '#D3D3D3',
			text: '#2C3E50',
			textSecondary: '#5A6C7D',
			border: '#BDBDBD'
		}
	},
	{
		id: 'nyc',
		name: 'NYC',
		description: 'Empire State of mind',
		isDark: true,
		preview: ['#1C1C1E', '#FFD700', '#B8860B', '#2F2F2F'],
		colors: {
			background: '#1C1C1E',
			surface: '#2F2F2F',
			primary: '#FFD700',
			secondary: '#FFA500',
			accent: '#B8860B',
			node: '#3A3A3C',
			nodeStroke: '#48484A',
			text: '#FFD700',
			textSecondary: '#C0C0C0',
			border: '#48484A'
		}
	},
	{
		id: 'downtown-ramallah-night',
		name: 'Downtown Ramallah at Night',
		description: 'Warm vintage moonlight',
		isDark: true,
		preview: ['#1A1511', '#E8C547', '#D4A574', '#2C2416'],
		colors: {
			background: '#1A1511',
			surface: '#2C2416',
			primary: '#E8C547',
			secondary: '#D4A574',
			accent: '#F4A460',
			node: '#3D3020',
			nodeStroke: '#5C4B2A',
			text: '#E8C547',
			textSecondary: '#C9A961',
			border: '#5C4B2A'
		}
	},
	{
		id: 'old-city-jerusalem',
		name: 'Old City Jerusalem',
		description: 'Golden stone and history',
		isDark: false,
		preview: ['#F0E4C8', '#1B4F72', '#D4AF37', '#E8D9B5'],
		colors: {
			background: '#F0E4C8',
			surface: '#FAF3E0',
			primary: '#1B4F72',
			secondary: '#D4AF37',
			accent: '#D4AF37',
			node: '#E8D9B5',
			nodeStroke: '#1B4F72',
			text: '#3A2E1F',
			textSecondary: '#6F6248',
			border: '#B8985A'
		}
	},
	{
		id: 'haifas-sea',
		name: "Haifa's Beach",
		description: 'Where the heart wanders',
		isDark: false,
		preview: ['#CFE8F0', '#1E88A8', '#5B8C5A', '#FFFFFF'],
		colors: {
			background: '#CFE8F0',
			surface: '#FFFFFF',
			primary: '#1E88A8',
			secondary: '#5B8C5A',
			accent: '#D4AF37',
			node: '#FFFFFF',
			nodeStroke: '#1E88A8',
			text: '#1B3A4B',
			textSecondary: '#4A7080',
			border: '#A8D4E0'
		}
	},
	{
		id: 'old-city-birzeit',
		name: 'Birzeit Old City',
		description: 'Vintage stone, olive trees, and golden sun',
		isDark: false,
		preview: ['#E5D8C2', '#6B7A3A', '#D3A74A', '#F2E9D3'],
		colors: {
			background: '#F2E9D3',       // sun-washed limestone
			surface: '#E5D8C2',          // vintage stone wall
			primary: '#6B7A3A',          // old olive trees
			secondary: '#8C9B54',        // lighter leaf green
			accent: '#D3A74A',           // warm golden sun
			node: '#E5D8C2',             // stone node
			nodeStroke: '#CBBFA8',       // soft edge like aged stone
			text: '#3A3A2E',             // deep neutral for readability
			textSecondary: '#6F6B58',    // muted stone-gray
			border: '#CBBFA8'            // subtle stone border
		}
	},
	{
		id: 'swaggy-ginger',
		name: 'Ginger Sunshine',
		description: 'When life gives you lemonade, make lemons... — Phil Dunphy',
		isDark: false,
		preview: ['#FFF8F0', '#FF8C42', '#FFFFFF', '#FFD9B3'],
		colors: {
			background: '#FFF8F0',
			surface: '#FFFFFF',
			primary: '#FF8C42',
			secondary: '#FFB380',
			accent: '#E85D04',
			node: '#FFEDD8',
			nodeStroke: '#FFCB9A',
			text: '#7A3E12',
			textSecondary: '#C97B3D',
			border: '#FFD9B3'
		}
	},
	{
		id: 'scooby-doo',
		name: 'Scooby Doo',
		description: 'Ruh oh RAGGY',
		isDark: false,
		preview: ['#F5E6D3', '#4A9B8E', '#8B5A2B', '#F4C430'],
		colors: {
			background: '#F5E6D3',
			surface: '#FFFFFF',
			primary: '#4A9B8E',
			secondary: '#8B5A2B',
			accent: '#F4C430',
			node: '#D2A679',
			nodeStroke: '#8B5A2B',
			text: '#3D2817',
			textSecondary: '#6B4423',
			border: '#4A9B8E'
		}
	},
	{
		id: 'kool-aid-man',
		name: 'Kool-Aid Man',
		description: 'OHHHHH YEAHHHHH!!!',
		isDark: false,
		preview: ['#FDF3E3', '#E4002B', '#FFFFFF', '#FFD1D1'],
		colors: {
			background: '#FDF3E3',
			surface: '#FFFFFF',
			primary: '#E4002B',
			secondary: '#B71C1C',
			accent: '#FFC300',
			node: '#FFD1D1',
			nodeStroke: '#E4002B',
			text: '#7A0000',
			textSecondary: '#B71C1C',
			border: '#E4002B'
		}
	},
	{
		id: 'dark-knight',
		name: 'The Dark Knight',
		description: 'Why so serious??? *breathes heavily and smacks lips*',
		isDark: true,
		preview: ['#0A0A0C', '#F5C518', '#3A3A3D', '#1A1A1E'],
		colors: {
			background: '#0A0A0C',
			surface: '#1A1A1E',
			primary: '#3A3A3D',
			secondary: '#1C1C1F',
			accent: '#F5C518',
			node: '#2A2A2E',
			nodeStroke: '#4A4A4E',
			text: '#E8E8E8',
			textSecondary: '#8A8A8E',
			border: '#3A3A3D'
		}
	},
	{
		id: 'matrix',
		name: 'Matrix',
		description: 'Follow the white rabbit',
		isDark: true,
		preview: ['#000000', '#00FF41', '#008F11', '#003B00'],
		colors: {
			background: '#000000',
			surface: '#0D0208',
			primary: '#00FF41',
			secondary: '#008F11',
			accent: '#00FF41',
			node: '#003B00',
			nodeStroke: '#00FF41',
			text: '#00FF41',
			textSecondary: '#008F11',
			border: '#003B00'
		}
	},
	{
		id: 'after-hours',
		name: 'After Hours',
		description: 'SAVE YOUR TEARS FOR ANOTHER DAY',
		isDark: true,
		preview: ['#0D0000', '#C8102E', '#FF0000', '#1A0505'],
		colors: {
			background: '#0D0000',
			surface: '#1A0505',
			primary: '#C8102E',
			secondary: '#8B0000',
			accent: '#FF0000',
			node: '#2B0808',
			nodeStroke: '#C8102E',
			text: '#FFFFFF',
			textSecondary: '#D4A5A5',
			border: '#8B0000'
		}
	},
	{
		id: 'tamagotchi',
		name: 'Tamagotchi',
		description: 'Feed me or else',
		isDark: false,
		preview: ['#FFD6E8', '#9BBC0F', '#FFFFFF', '#C7E8CA'],
		colors: {
			background: '#FFD6E8',
			surface: '#FFFFFF',
			primary: '#9BBC0F',
			secondary: '#8BAC0F',
			accent: '#6B8E23',
			node: '#C7E8CA',
			nodeStroke: '#9BBC0F',
			text: '#306230',
			textSecondary: '#5A7942',
			border: '#FFB3D9'
		}
	},
	{
		id: 'spongebob',
		name: 'SpongeBob SquarePants',
		description: 'Who lives in a pineapple',
		isDark: false,
		preview: ['#87CEEB', '#FFEB3B', '#8B4513', '#FFFFFF'],
		colors: {
			background: '#87CEEB',
			surface: '#FFFFFF',
			primary: '#FFEB3B',
			secondary: '#8B4513',
			accent: '#FF4444',
			node: '#FFF9C4',
			nodeStroke: '#FBC02D',
			text: '#1A1A1A',
			textSecondary: '#5D4037',
			border: '#FFEB3B'
		}
	},
	{
		id: 'shrek',
		name: 'Shrek',
		description: "It's all ogre now",
		isDark: false,
		preview: ['#DCE8B0', '#6B9B37', '#8B5A2B', '#FFFFFF'],
		colors: {
			background: '#DCE8B0',
			surface: '#FFFFFF',
			primary: '#6B9B37',
			secondary: '#4A6B1F',
			accent: '#8B5A2B',
			node: '#B8CC7A',
			nodeStroke: '#6B9B37',
			text: '#2E3B1A',
			textSecondary: '#5A6B3D',
			border: '#6B9B37'
		}
	},
	{
		id: 'among-us',
		name: 'Among Us',
		description: 'SUSSY BACA',
		isDark: true,
		preview: ['#0B0E1A', '#C51111', '#FFFFFF', '#151A2E'],
		colors: {
			background: '#0B0E1A',
			surface: '#151A2E',
			primary: '#C51111',
			secondary: '#FFFFFF',
			accent: '#C51111',
			node: '#1E2438',
			nodeStroke: '#C51111',
			text: '#FFFFFF',
			textSecondary: '#8A93B8',
			border: '#C51111'
		}
	},
	{
		id: 'burgundy-royale',
		name: 'Burgundy',
		description: 'Color of the year award',
		isDark: true,
		preview: ['#4A0E1F', '#FFFFFF', '#B43757', '#2E0A15'],
		colors: {
			background: '#4A0E1F',
			surface: '#2E0A15',
			primary: '#FFFFFF',
			secondary: '#B43757',
			accent: '#FFCCD5',
			node: '#3B0C19',
			nodeStroke: '#7A1E33',
			text: '#FFFFFF',
			textSecondary: '#E6B3C2',
			border: '#7A1E33'
		}
	},
	{
		id: 'lake-como',
		name: 'Lake Como',
		description: 'Je suis la bas',
		isDark: false,
		preview: ['#CFE6FA', '#1F73C8', '#7FB87A', '#F8E7B5'],
		colors: {
			background: '#CFE6FA',
			surface: '#F8F5EC',
			primary: '#1F73C8',
			secondary: '#7FB87A',
			accent: '#F2C94C',
			node: '#F8F5EC',
			nodeStroke: '#C7D7E4',
			text: '#1F2D36',
			textSecondary: '#54646E',
			border: '#C7D7E4'
		}
	},
	{
		id: 'albanian-cottage',
		name: 'Albanian Cottage House',
		description: 'Stone walls, red roof, no wifi',
		isDark: false,
		preview: ['#EDE6D6', '#B5533C', '#4B5D3A', '#8B6F47'],
		colors: {
			background: '#EDE6D6',
			surface: '#F5F0E6',
			primary: '#B5533C',
			secondary: '#4B5D3A',
			accent: '#8B6F47',
			node: '#D9CBB3',
			nodeStroke: '#8B6F47',
			text: '#3A2E1F',
			textSecondary: '#6B5D47',
			border: '#8B6F47'
		}
	},
	{
		id: 'remember-that-90s-aesthetic',
		name: 'Remember That One 90s Aesthetic?',
		description: 'Old images I cannot relate to',
		isDark: true,
		preview: ['#0D0221', '#00F0FF', '#FF00FF', '#B026FF'],
		colors: {
			background: '#0D0221',
			surface: '#1B0B3B',
			primary: '#00F0FF',
			secondary: '#FF00FF',
			accent: '#B026FF',
			node: '#2D1B4E',
			nodeStroke: '#00F0FF',
			text: '#FFFFFF',
			textSecondary: '#B026FF',
			border: '#FF00FF'
		}
	},
	{
		id: 'grandmas-plastic-couch',
		name: "Grandma's Couch",
		description: "Don't sit there, it's for guests",
		isDark: false,
		preview: ['#F5E9E2', '#C48793', '#8A9A5B', '#B08968'],
		colors: {
			background: '#F5E9E2',
			surface: '#FFFFFF',
			primary: '#C48793',
			secondary: '#8A9A5B',
			accent: '#B08968',
			node: '#EAD9D2',
			nodeStroke: '#C48793',
			text: '#5C4033',
			textSecondary: '#8A6F5C',
			border: '#B08968'
		}
	},
	{
		id: 'henry-04',
		name: "04' Henry",
		description: 'The Invincibles, Highbury',
		isDark: false,
		preview: ['#F7F5F2', '#EF0107', '#9C824A', '#FFFFFF'],
		colors: {
			background: '#F7F5F2',
			surface: '#FFFFFF',
			primary: '#EF0107',
			secondary: '#FFFFFF',
			accent: '#9C824A',
			node: '#FFFFFF',
			nodeStroke: '#EF0107',
			text: '#1A0000',
			textSecondary: '#8B0000',
			border: '#EF0107'
		}
	},
	{
		id: 'didier-drogba-05',
		name: "05' Didier Drogba",
		description: 'Stamford Bridge',
		isDark: false,
		preview: ['#F5F7FA', '#034694', '#DBA111', '#DCE9F5'],
		colors: {
			background: '#F5F7FA',
			surface: '#FFFFFF',
			primary: '#034694',
			secondary: '#6CABDD',
			accent: '#DBA111',
			node: '#DCE9F5',
			nodeStroke: '#034694',
			text: '#031C33',
			textSecondary: '#034694',
			border: '#034694'
		}
	},
	{
		id: 'zidane-98',
		name: "98' Zidane",
		description: 'Stade de France, July 12th',
		isDark: false,
		preview: ['#F4F6F8', '#0033A0', '#ED2939', '#E8EDF5'],
		colors: {
			background: '#F4F6F8',
			surface: '#FFFFFF',
			primary: '#0033A0',
			secondary: '#ED2939',
			accent: '#ED2939',
			node: '#E8EDF5',
			nodeStroke: '#0033A0',
			text: '#001A4D',
			textSecondary: '#3355A0',
			border: '#0033A0'
		}
	},
	{
		id: 'ozil-14',
		name: "14' Ozil",
		description: 'Maracanã, world champions',
		isDark: false,
		preview: ['#F5F5F5', '#1A1A1A', '#FFCE00', '#FFFFFF'],
		colors: {
			background: '#F5F5F5',
			surface: '#FFFFFF',
			primary: '#1A1A1A',
			secondary: '#DD0000',
			accent: '#FFCE00',
			node: '#FFFFFF',
			nodeStroke: '#1A1A1A',
			text: '#1A1A1A',
			textSecondary: '#4A4A4A',
			border: '#1A1A1A'
		}
	},
	{
		id: 'nokia-3310-snake',
		name: 'Nokia 3310 Snake',
		description: 'Indestructible and proud of it',
		isDark: false,
		preview: ['#C7D6A3', '#4A5D23', '#5C6B2E', '#2E3B14'],
		colors: {
			background: '#C7D6A3',
			surface: '#B8CC8F',
			primary: '#4A5D23',
			secondary: '#5C6B2E',
			accent: '#2E3B14',
			node: '#A9C285',
			nodeStroke: '#4A5D23',
			text: '#2E3B14',
			textSecondary: '#4A5D23',
			border: '#4A5D23'
		}
	},
	{
		id: 'abandoned-blockbuster',
		name: 'Abandoned Blockbuster at 2AM',
		description: 'Be kind, please rewind',
		isDark: true,
		preview: ['#0A1420', '#1E3A5F', '#F2C94C', '#3D5A80'],
		colors: {
			background: '#0A1420',
			surface: '#12212F',
			primary: '#1E3A5F',
			secondary: '#F2C94C',
			accent: '#F2C94C',
			node: '#1B2E42',
			nodeStroke: '#3D5A80',
			text: '#D8E2E8',
			textSecondary: '#7A8B99',
			border: '#1E3A5F'
		}
	},
	{
		id: 'good-morning-forward',
		name: "The Alarm that Wakes You Up in the Morning",
		description: '6:47 AM, no context',
		isDark: false,
		preview: ['#FFF8E7', '#B8860B', '#C41E3A', '#DAA520'],
		colors: {
			background: '#FFF8E7',
			surface: '#FFFFFF',
			primary: '#B8860B',
			secondary: '#C41E3A',
			accent: '#B8860B',
			node: '#FFE9B3',
			nodeStroke: '#B8860B',
			text: '#8B0000',
			textSecondary: '#B8860B',
			border: '#DAA520'
		}
	},
	{
		id: 'girly-pop',
		name: 'Girly Pop',
		description: 'Pink dreams and sparkles',
		isDark: false,
		preview: ['#FFE5F1', '#FF69B4', '#FFB6D9', '#FFF0F5'],
		colors: {
			background: '#FFF0F5',
			surface: '#FFE5F1',
			primary: '#FF69B4',
			secondary: '#FFB6D9',
			accent: '#FF1493',
			node: '#FFE5F1',
			nodeStroke: '#FFB6D9',
			text: '#C71585',
			textSecondary: '#DB7093',
			border: '#FFB6D9'
		}
	},
	{
		id: 'popped-out-80s',
		name: "Popped Out 80's",
		description: 'Neon nights',
		isDark: true,
		preview: ['#1A1A2E', '#FF006E', '#00F5FF', '#FFBE0B'],
		colors: {
			background: '#1A1A2E',
			surface: '#16213E',
			primary: '#FF006E',
			secondary: '#00F5FF',
			accent: '#FFBE0B',
			node: '#0F3460',
			nodeStroke: '#533483',
			text: '#FF006E',
			textSecondary: '#00F5FF',
			border: '#533483'
		}
	},
	{
		id: 'pink-lemonade',
		name: 'Pink Lemonade',
		description: 'Sweet and tangy',
		isDark: false,
		preview: ['#FFF8E7', '#FF6B9D', '#FFC6D9', '#FFFACD'],
		colors: {
			background: '#FFF8E7',
			surface: '#FFFACD',
			primary: '#FF6B9D',
			secondary: '#FFC6D9',
			accent: '#FFB347',
			node: '#FFF0F5',
			nodeStroke: '#FFB6C1',
			text: '#D63384',
			textSecondary: '#FF69B4',
			border: '#FFB6C1'
		}
	},
	{
		id: 'taro-bubble-tea',
		name: 'Taro Bubble Tea',
		description: 'Creamy purple goodness',
		isDark: false,
		preview: ['#F5F0FF', '#9B7EBD', '#C8B6E2', '#E5D4FF'],
		colors: {
			background: '#F5F0FF',
			surface: '#E5D4FF',
			primary: '#9B7EBD',
			secondary: '#C8B6E2',
			accent: '#7C5295',
			node: '#E5D4FF',
			nodeStroke: '#C8B6E2',
			text: '#5A3E7B',
			textSecondary: '#8B6EA8',
			border: '#C8B6E2'
		}
	},
	{
		id: 'nord',
		name: 'Nord',
		description: 'Arctic, north-bluish',
		isDark: true,
		preview: ['#2E3440', '#88C0D0', '#5E81AC', '#4C566A'],
		colors: {
			background: '#2E3440',
			surface: '#3B4252',
			primary: '#88C0D0',
			secondary: '#5E81AC',
			accent: '#88C0D0',
			node: '#4C566A',
			nodeStroke: '#434C5E',
			text: '#ECEFF4',
			textSecondary: '#D8DEE9',
			border: '#434C5E'
		}
	},
	{
		id: 'dracula',
		name: 'Dracula',
		description: 'Dark theme for vampires',
		isDark: true,
		preview: ['#282A36', '#FF79C6', '#BD93F9', '#44475A'],
		colors: {
			background: '#282A36',
			surface: '#1e1f29',
			primary: '#FF79C6',
			secondary: '#BD93F9',
			accent: '#FF79C6',
			node: '#44475A',
			nodeStroke: '#6272A4',
			text: '#F8F8F2',
			textSecondary: '#C5C8C6',
			border: '#44475A'
		}
	},
	{
		id: 'monokai',
		name: 'Monokai',
		description: 'Vibrant and colorful',
		isDark: true,
		preview: ['#272822', '#F92672', '#A6E22E', '#49483E'],
		colors: {
			background: '#272822',
			surface: '#1e1f1c',
			primary: '#F92672',
			secondary: '#A6E22E',
			accent: '#FD971F',
			node: '#49483E',
			nodeStroke: '#75715E',
			text: '#F8F8F2',
			textSecondary: '#CFCFC2',
			border: '#49483E'
		}
	},
	{
		id: 'gruvbox-light',
		name: 'Gruvbox Light',
		description: 'Retro groove, light variant',
		isDark: false,
		preview: ['#FBF1C7', '#458588', '#CC241D', '#EBDBB2'],
		colors: {
			background: '#FBF1C7',
			surface: '#F9F5D7',
			primary: '#458588',
			secondary: '#CC241D',
			accent: '#D65D0E',
			node: '#EBDBB2',
			nodeStroke: '#D5C4A1',
			text: '#3C3836',
			textSecondary: '#665C54',
			border: '#D5C4A1'
		}
	},
	{
		id: 'gruvbox-dark',
		name: 'Gruvbox Dark',
		description: 'Retro groove, dark variant',
		isDark: true,
		preview: ['#282828', '#458588', '#CC241D', '#3C3836'],
		colors: {
			background: '#282828',
			surface: '#1d2021',
			primary: '#458588',
			secondary: '#CC241D',
			accent: '#D65D0E',
			node: '#3C3836',
			nodeStroke: '#504945',
			text: '#EBDBB2',
			textSecondary: '#BDAE93',
			border: '#504945'
		}
	},
	{
		id: 'solarized-light',
		name: 'Solarized Light',
		description: 'Precision colors',
		isDark: false,
		preview: ['#FDF6E3', '#268BD2', '#DC322F', '#EEE8D5'],
		colors: {
			background: '#FDF6E3',
			surface: '#EEE8D5',
			primary: '#268BD2',
			secondary: '#2AA198',
			accent: '#D33682',
			node: '#EEE8D5',
			nodeStroke: '#93A1A1',
			text: '#657B83',
			textSecondary: '#839496',
			border: '#93A1A1'
		}
	},
	{
		id: 'solarized-dark',
		name: 'Solarized Dark',
		description: 'Precision colors for night',
		isDark: true,
		preview: ['#002B36', '#268BD2', '#DC322F', '#073642'],
		colors: {
			background: '#002B36',
			surface: '#073642',
			primary: '#268BD2',
			secondary: '#2AA198',
			accent: '#D33682',
			node: '#073642',
			nodeStroke: '#586E75',
			text: '#839496',
			textSecondary: '#93A1A1',
			border: '#586E75'
		}
	},
	{
		id: 'github-light',
		name: 'GitHub Light',
		description: 'Clean and professional',
		isDark: false,
		preview: ['#FFFFFF', '#0366D6', '#28A745', '#F6F8FA'],
		colors: {
			background: '#FFFFFF',
			surface: '#F6F8FA',
			primary: '#0366D6',
			secondary: '#28A745',
			accent: '#0366D6',
			node: '#F6F8FA',
			nodeStroke: '#E1E4E8',
			text: '#24292E',
			textSecondary: '#586069',
			border: '#E1E4E8'
		}
	},
	{
		id: 'github-dark',
		name: 'GitHub Dark',
		description: 'Easy on the eyes, professional',
		isDark: true,
		preview: ['#0D1117', '#58A6FF', '#3FB950', '#161B22'],
		colors: {
			background: '#0D1117',
			surface: '#161B22',
			primary: '#58A6FF',
			secondary: '#3FB950',
			accent: '#58A6FF',
			node: '#161B22',
			nodeStroke: '#30363D',
			text: '#C9D1D9',
			textSecondary: '#8B949E',
			border: '#30363D'
		}
	},
	{
		id: 'tokyo-night',
		name: 'Tokyo Night',
		description: 'A clean dark theme',
		isDark: true,
		preview: ['#1A1B26', '#7AA2F7', '#BB9AF7', '#24283B'],
		colors: {
			background: '#1A1B26',
			surface: '#24283B',
			primary: '#7AA2F7',
			secondary: '#BB9AF7',
			accent: '#7DCFFF',
			node: '#24283B',
			nodeStroke: '#414868',
			text: '#C0CAF5',
			textSecondary: '#A9B1D6',
			border: '#414868'
		}
	},
	{
		id: 'catppuccin-mocha',
		name: 'Catppuccin Mocha',
		description: 'Soothing pastel theme',
		isDark: true,
		preview: ['#1E1E2E', '#89B4FA', '#F5C2E7', '#313244'],
		colors: {
			background: '#1E1E2E',
			surface: '#181825',
			primary: '#89B4FA',
			secondary: '#F5C2E7',
			accent: '#CBA6F7',
			node: '#313244',
			nodeStroke: '#45475A',
			text: '#CDD6F4',
			textSecondary: '#BAC2DE',
			border: '#45475A'
		}
	},
	{
		id: 'rose-pine',
		name: 'Rosé Pine',
		description: 'All natural pine, faux fur and a bit of soho vibes',
		isDark: true,
		preview: ['#191724', '#EBBCBA', '#9CCFD8', '#26233A'],
		colors: {
			background: '#191724',
			surface: '#1F1D2E',
			primary: '#EBBCBA',
			secondary: '#9CCFD8',
			accent: '#C4A7E7',
			node: '#26233A',
			nodeStroke: '#403D52',
			text: '#E0DEF4',
			textSecondary: '#908CAA',
			border: '#403D52'
		}
	},
	{
		id: 'everforest',
		name: 'Everforest',
		description: 'Comfortable & pleasant',
		isDark: true,
		preview: ['#2D353B', '#A7C080', '#D699B6', '#343F44'],
		colors: {
			background: '#2D353B',
			surface: '#232A2E',
			primary: '#A7C080',
			secondary: '#7FBBB3',
			accent: '#D699B6',
			node: '#343F44',
			nodeStroke: '#3D484D',
			text: '#D3C6AA',
			textSecondary: '#859289',
			border: '#3D484D'
		}
	}
];
