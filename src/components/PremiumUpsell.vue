<script setup>
import { currentTheme } from '../composables/graphNode/useThemes';
import { isPremium, showPremiumModal, openPremiumModal, closePremiumModal, signInUrl } from '../composables/graphNode/usePremium';
import { setProcessingMode } from '../composables/graphNode/useAIModels';

function handleStayLocal() {
	setProcessingMode('local');
	closePremiumModal();
}
</script>

<template>
	<!-- <button v-if="!isPremium" @click="openPremiumModal"
		class="fixed top-20 right-6 z-[1000] px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg transition-all flex items-center gap-1.5"
		style="background-color: #4A90E2; box-shadow: 0 10px 25px -5px rgba(74, 144, 226, 0.4);">
		<span></span>
	</button> -->

	<div v-if="showPremiumModal" @click="closePremiumModal"
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2200] flex items-center justify-center p-4 animate-fadeIn">
		<div @click.stop class="border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn" :style="{
			backgroundColor: currentTheme.colors.surface,
			borderColor: currentTheme.colors.border
		}">
			<div class="flex justify-between items-start mb-4">
				<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">Rocus Premium</h3>
				<button @click="closePremiumModal" class="p-2 rounded-xl transition-all">
					<svg class="w-5 h-5" :style="{ color: currentTheme.colors.textSecondary }" fill="none"
						stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<p class="mb-6" :style="{ color: currentTheme.colors.textSecondary }">
				Unlock Cloud AI Processing - Rocus summarizes and organizes every page using Claude instead of the
				local model, for faster and richer results.
			</p>

			<a :href="signInUrl()"
				class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold transition-all"
				style="background-color: #4A90E2;">
				Continue with Cloud
			</a>

			<button
				@click="handleStayLocal"
				class="w-full mt-3 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all border"
				:style="{ color: currentTheme.colors.text, borderColor: currentTheme.colors.border }">
				Use the free and local mode
			</button>

			<p class="text-xs mt-4 text-center" :style="{ color: currentTheme.colors.textSecondary }">
				Rocus itself stays free and open - Premium just unlocks Cloud AI Processing.
			</p>
		</div>
	</div>
</template>
