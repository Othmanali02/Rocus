import { ref, computed } from "vue";
import { themes } from "./themeData";
import { container } from "./useGraphEngine";

// Theme picker state + the logic that paints the current theme onto the
// live D3 graph. `container` is read from useGraphEngine (a live D3
// selection) - safe circular import with useGraphEngine, since every access
// happens inside a function body, never at module-evaluation time.

export { themes };

export const currentTheme = ref({
	id: 'default-light',
	name: 'Default Light',
	isDark: false,
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
});

export const isDarkMode = ref(false);
export const showThemes = ref(false);

export const themeClasses = computed(() => ({
	surface: currentTheme.value.isDark ? 'bg-black' : 'bg-white',
	surfaceHover: currentTheme.value.isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-50',
	border: currentTheme.value.isDark ? 'border-gray-800' : 'border-gray-200',
	text: currentTheme.value.isDark ? 'text-white' : 'text-gray-900',
	textSecondary: currentTheme.value.isDark ? 'text-gray-400' : 'text-gray-600',
	buttonBg: currentTheme.value.isDark ? 'bg-black' : 'bg-white',
	buttonHover: currentTheme.value.isDark ? 'hover:bg-[#212121]' : 'hover:bg-gray-100',
}));

export function toggleThemes() {
	showThemes.value = !showThemes.value;
}

export function closeThemes() {
	showThemes.value = false;
}

export function previewTheme(theme) {
	// Temporarily apply theme on hover
	applyThemeColors(theme);
}

export function applyTheme(theme) {
	currentTheme.value = theme;
	isDarkMode.value = theme.isDark;
	localStorage.setItem('theme', theme.id);
	localStorage.setItem('darkMode', theme.isDark.toString());
	applyThemeColors(theme);
	closeThemes();
}

export function applyThemeColors(theme) {
	if (!theme || !theme.colors) return;

	// Update CSS variables
	const root = document.documentElement;
	Object.entries(theme.colors).forEach(([key, value]) => {
		root.style.setProperty(`--color-${key}`, value);
	});

	// Update D3 nodes if graph exists
	if (container) {
		container
			.select(".nodes")
			.selectAll(".node")
			.transition()
			.duration(300)
			.attr("fill", (d) => {
				if (d.type === "discover") return theme.colors.primary;
				if (d.type === "website") return theme.colors.node;
				return theme.colors.node;
			})
			.attr("stroke", (d) => {
				if (d.type === "discover") return theme.colors.secondary;
				if (d.type === "website") return theme.colors.nodeStroke;
				return theme.colors.nodeStroke;
			});

		container
			.select(".labels")
			.selectAll(".node-label")
			.transition()
			.duration(300)
			.style("fill", (d) => {
				if (d.type === "discover") return "#ffffff";
				return theme.colors.text;
			});

		// Update links too
		container
			.select(".links")
			.selectAll(".link")
			.transition()
			.duration(300)
			.style("stroke", (d) => {
				if (d.type === 'discover-link') return theme.colors.nodeStroke;
				if (d.type === 'website-link') return theme.colors.nodeStroke;
				return theme.colors.nodeStroke;
			});
	}
}

export function loadThemePreference() {
	const savedThemeId = localStorage.getItem('theme');
	if (savedThemeId) {
		const theme = themes.find(t => t.id === savedThemeId);
		if (theme) {
			currentTheme.value = theme;
			isDarkMode.value = theme.isDark;
			applyThemeColors(theme);
			return;
		}
	}

	// Default theme
	currentTheme.value = themes[0];
	applyThemeColors(themes[0]);
}

export function loadDarkModePreference() {
	const saved = localStorage.getItem('darkMode');
	if (saved !== null) {
		isDarkMode.value = saved === 'true';
		updateTheme();
	}
}

export function toggleDarkMode() {
	// Find the opposite theme (light <-> dark)
	const newTheme = currentTheme.value.isDark
		? themes.find(t => t.id === 'default-light')
		: themes.find(t => t.id === 'default-dark');

	if (newTheme) {
		applyTheme(newTheme);
	}
}

export function updateTheme() {
	if (!currentTheme.value || !container) return;

	applyThemeColors(currentTheme.value);
}
