<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { currentTheme } from '../composables/graphNode/useThemes';
import { isPremium, showPremiumModal, premiumModalReason, openPremiumModal, closePremiumModal } from '../composables/graphNode/usePremium';
import { setProcessingMode } from '../composables/graphNode/useAIModels';

const router = useRouter();

// "Use the free and local mode" and the AI-processing footer note only make
// sense for the default (Cloud AI Processing) trigger - a sharing-limit
// trigger has nothing to do with the local model, so both are hidden then.
const copy = computed(() => {
	if (premiumModalReason.value === 'share_seat_cap') {
		return {
			body: "Upgrade to Rocus Premium to invite more people to your workspace - free accounts can invite 1 collaborator per shared graph.",
			showStayLocal: false,
			footerNote: null,
		};
	}
	if (premiumModalReason.value === 'share_graph_cap') {
		return {
			body: "Upgrade to Rocus Premium to share more graphs - free accounts can share up to 3 graphs at a time.",
			showStayLocal: false,
			footerNote: null,
		};
	}
	return {
		body: "Unlock Cloud AI Processing - Rocus summarizes and organizes every page using Claude instead of the local model, for faster and richer results.",
		showStayLocal: true,
		footerNote: "Rocus itself stays free and open - Premium just unlocks Cloud AI Processing.",
	};
});

function handleStayLocal() {
	setProcessingMode('local');
	closePremiumModal();
}

function goToPricing() {
	closePremiumModal();
	router.push('/pricing');
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
				{{ copy.body }}
			</p>

			<button @click="goToPricing"
				class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold transition-all"
				style="background-color: #4A90E2;">
				See Premium Pricing
			</button>

			<button
				v-if="copy.showStayLocal"
				@click="handleStayLocal"
				class="w-full mt-3 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all border"
				:style="{ color: currentTheme.colors.text, borderColor: currentTheme.colors.border }">
				Use the free and local mode
			</button>

			<p v-if="copy.footerNote" class="text-xs mt-4 text-center" :style="{ color: currentTheme.colors.textSecondary }">
				{{ copy.footerNote }}
			</p>
		</div>
	</div>
</template>
