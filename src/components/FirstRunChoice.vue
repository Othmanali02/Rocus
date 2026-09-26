<!--
Copyright (C) 2025-2026 Othman Ali

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with this program. If not, see
<https://www.gnu.org/licenses/>.
-->
<script setup>
import { currentTheme } from '../composables/graphNode/useThemes';

const emit = defineEmits(['choose']);
</script>

<template>
	<div class="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-8"
		:style="{ backgroundColor: currentTheme.colors.background }">
		<div class="w-full max-w-3xl">
			<div class="text-center mb-8">
				<h1 class="text-2xl sm:text-3xl font-bold mb-2" :style="{ color: currentTheme.colors.text }">
					How should Rocus process what you save?
				</h1>
				<p class="text-sm sm:text-base" :style="{ color: currentTheme.colors.textSecondary }">
					You can change this later in Settings.
				</p>
			</div>

			<div class="grid sm:grid-cols-2 gap-4 sm:gap-6">
				<!-- Cloud, shown first -->
				<button @click="emit('choose', 'commercial')"
					class="text-left rounded-2xl p-6 border-2 transition-all hover:scale-[1.01]"
					:style="{ backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }">
					<div class="text-lg font-bold mb-2" :style="{ color: currentTheme.colors.text }">
						Try it first
					</div>
					<p class="text-sm mb-4" :style="{ color: currentTheme.colors.textSecondary }">
						Cloud processing, no download - starts right away. Free for up to
						<strong :style="{ color: currentTheme.colors.text }">5 saves a day</strong>.
					</p>
					<div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
						style="background-color: #4A90E2;">
						Use cloud processing
					</div>
				</button>

				<!-- Local -->
				<button @click="emit('choose', 'local')"
					class="text-left rounded-2xl p-6 border-2 transition-all hover:scale-[1.01]"
					:style="{ backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }">
					<div class="text-lg font-bold mb-2" :style="{ color: currentTheme.colors.text }">
						Run it on my machine
					</div>
					<p class="text-sm mb-4" :style="{ color: currentTheme.colors.textSecondary }">
						The AI runs entirely in your browser - nothing about what you save ever leaves your
						device. One-time <strong :style="{ color: currentTheme.colors.text }">~350MB
						download</strong> to set it up, then unlimited saves, always private.
					</p>
					<div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border"
						:style="{ color: currentTheme.colors.text, borderColor: currentTheme.colors.border }">
						Download & run locally
					</div>
				</button>
			</div>

			<p class="text-xs text-center mt-6 max-w-xl mx-auto" :style="{ color: currentTheme.colors.textSecondary }">
				In cloud mode, page text is sent to Anthropic for processing - not stored, and not used for
				training. Local mode sends nothing off your device.
			</p>
		</div>
	</div>
</template>
