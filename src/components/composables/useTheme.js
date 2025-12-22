import { ref, computed } from "vue";
import { themes } from "../constants/themes";

export function useTheme() {
	const currentTheme = ref(themes[0]);
	const showThemes = ref(false);
	const isDarkMode = ref(false);

	const themeClasses = computed(() => ({
		surface: currentTheme.value.isDark ? "bg-black" : "bg-white",
		surfaceHover: currentTheme.value.isDark
			? "hover:bg-gray-900"
			: "hover:bg-gray-50",
		border: currentTheme.value.isDark ? "border-gray-800" : "border-gray-200",
		text: currentTheme.value.isDark ? "text-white" : "text-gray-900",
		textSecondary: currentTheme.value.isDark
			? "text-gray-400"
			: "text-gray-600",
		buttonBg: currentTheme.value.isDark ? "bg-black" : "bg-white",
		buttonHover: currentTheme.value.isDark
			? "hover:bg-[#212121]"
			: "hover:bg-gray-100",
	}));

	function toggleThemes() {
		showThemes.value = !showThemes.value;
	}

	function closeThemes() {
		showThemes.value = false;
	}

	function previewTheme(theme) {
		applyThemeColors(theme);
	}

	function applyTheme(theme) {
		currentTheme.value = theme;
		isDarkMode.value = theme.isDark;
		localStorage.setItem("theme", theme.id);
		localStorage.setItem("darkMode", theme.isDark.toString());
		applyThemeColors(theme);
		closeThemes();
	}

	function applyThemeColors(theme, container = null) {
		if (!theme || !theme.colors) return;

		// Update CSS variables
		const root = document.documentElement;
		Object.entries(theme.colors).forEach(([key, value]) => {
			root.style.setProperty(`--color-${key}`, value); // FIXED: Added parenthesis
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

			container
				.select(".links")
				.selectAll(".link")
				.transition()
				.duration(300)
				.style("stroke", (d) => {
					if (d.type === "discover-link") return theme.colors.nodeStroke;
					if (d.type === "website-link") return theme.colors.nodeStroke;
					return theme.colors.nodeStroke;
				});
		}
	}

	function loadThemePreference() {
		const savedThemeId = localStorage.getItem("theme");
		if (savedThemeId) {
			const theme = themes.find((t) => t.id === savedThemeId);
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

	function toggleDarkMode() {
		const newTheme = currentTheme.value.isDark
			? themes.find((t) => t.id === "default-light")
			: themes.find((t) => t.id === "default-dark");

		if (newTheme) {
			applyTheme(newTheme);
		}
	}

	return {
		currentTheme,
		showThemes,
		isDarkMode,
		themeClasses,
		toggleThemes,
		closeThemes,
		previewTheme,
		applyTheme,
		applyThemeColors,
		loadThemePreference,
		toggleDarkMode,
	};
}
