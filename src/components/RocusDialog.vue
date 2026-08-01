<script setup>
import { currentTheme } from '../composables/graphNode/useThemes';
import { dialogState, resolveRocusDialog } from '../composables/useRocusDialog';
</script>

<template>
	<div v-if="dialogState" @click="dialogState.type === 'alert' ? resolveRocusDialog(true) : null"
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2300] flex items-center justify-center p-4 animate-fadeIn">
		<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
			backgroundColor: currentTheme.colors.surface,
			borderColor: currentTheme.colors.border
		}">
			<h3 class="text-xl font-bold mb-3" :style="{ color: currentTheme.colors.text }">
				{{ dialogState.title }}
			</h3>
			<p class="mb-6 whitespace-pre-wrap" :style="{ color: currentTheme.colors.textSecondary }">
				{{ dialogState.message }}
			</p>

			<div class="flex gap-3">
				<button v-if="dialogState.type === 'confirm'" @click="resolveRocusDialog(false)"
					class="flex-1 px-6 py-3 rounded-xl font-medium transition-all"
					:style="{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.textSecondary }">
					{{ dialogState.cancelText }}
				</button>
				<button @click="resolveRocusDialog(true)"
					class="flex-1 px-6 py-3 rounded-xl font-medium transition-all text-white shadow-lg"
					:style="{
						backgroundColor: dialogState.danger ? '#dc2626' : currentTheme.colors.primary,
						boxShadow: `0 10px 25px -5px ${dialogState.danger ? 'rgba(220, 38, 38, 0.3)' : 'rgba(74, 144, 226, 0.3)'}`,
					}">
					{{ dialogState.confirmText }}
				</button>
			</div>
		</div>
	</div>
</template>
