<script setup>
import { ref } from 'vue';
import { currentTheme } from '../composables/graphNode/useThemes';
import { API_BASE } from './constants/config';

const email = ref('');
const state = ref('idle'); // 'idle' | 'submitting' | 'done' | 'error'

async function submit() {
	if (!email.value.trim() || state.value === 'submitting') return;
	state.value = 'submitting';
	try {
		const res = await fetch(`${API_BASE}/api/waitlist`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.value.trim() }),
		});
		if (!res.ok) throw new Error('waitlist_signup_failed');
		state.value = 'done';
	} catch {
		state.value = 'error';
	}
}
</script>

<template>
	<div>
		<p v-if="state !== 'done'" class="text-xs mb-2" :style="{ color: currentTheme.colors.textSecondary }">
			Hosted sync across devices and shared graphs are coming - leave your email.
		</p>
		<p v-if="state === 'done'" class="text-xs" :style="{ color: currentTheme.colors.textSecondary }">
			Thanks - we'll let you know.
		</p>
		<form v-else class="flex gap-2" @submit.prevent="submit">
			<input v-model="email" type="email" placeholder="you@example.com" required
				class="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm border"
				:style="{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.text, borderColor: currentTheme.colors.border }" />
			<button type="submit" :disabled="state === 'submitting'"
				class="px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
				style="background-color: #4A90E2;">
				{{ state === 'submitting' ? '...' : 'Notify me' }}
			</button>
		</form>
		<p v-if="state === 'error'" class="text-xs mt-1" style="color: #dc2626;">
			Something went wrong - try again in a moment.
		</p>
	</div>
</template>
