<!--
Copyright (C) 2025-2026 Rocus

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
import { computed } from 'vue';
import { currentTheme } from '../composables/graphNode/useThemes';
import { showPremiumModal, premiumModalReason, closePremiumModal } from '../composables/graphNode/usePremium';
import { setProcessingMode } from '../composables/graphNode/useAIModels';
import WaitlistEmailCapture from './WaitlistEmailCapture.vue';

// Pricing/premium wording is scoped out for now (payments aren't live) -
// this modal still fires for the same four triggers (quota exhausted,
// server-wide cloud capacity, sharing seat cap, sharing graph cap), just
// without ever pointing anywhere to pay. The two sharing-limit triggers no
// longer have any action to offer beyond dismissing (no upgrade path exists
// right now), so they're plain, closeable notices.
const copy = computed(() => {
	if (premiumModalReason.value === 'share_seat_cap') {
		return {
			body: "Free accounts can invite 1 collaborator per shared graph.",
			showStayLocal: false,
			showWaitlist: false,
			footerNote: null,
		};
	}
	if (premiumModalReason.value === 'share_graph_cap') {
		return {
			body: "Free accounts can share up to 3 graphs at a time.",
			showStayLocal: false,
			showWaitlist: false,
			footerNote: null,
		};
	}
	if (premiumModalReason.value === 'server_capacity') {
		return {
			body: "Cloud processing is temporarily at capacity - try local mode instead.",
			showStayLocal: true,
			showWaitlist: false,
			footerNote: null,
		};
	}
	return {
		body: "Unlock unlimited AI processing - Rocus summarizes and organizes every page using Claude instead of the local model, for faster and richer results.",
		showStayLocal: true,
		showWaitlist: true,
		footerNote: "Rocus itself stays free and open.",
	};
});

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
				<h3 class="text-2xl font-bold" :style="{ color: currentTheme.colors.text }">Heads up</h3>
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

			<button
				v-if="copy.showStayLocal"
				@click="handleStayLocal"
				class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-all"
				style="background-color: #4A90E2;">
				Use the free and local mode
			</button>

			<WaitlistEmailCapture v-if="copy.showWaitlist" class="mt-4" />

			<p v-if="copy.footerNote" class="text-xs mt-4 text-center" :style="{ color: currentTheme.colors.textSecondary }">
				{{ copy.footerNote }}
			</p>
		</div>
	</div>
</template>
