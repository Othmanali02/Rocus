<script setup>
import axios from 'axios';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../router/store';
import { API_BASE } from './constants/config';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
    const queryString = Object.keys(route.query)
        .map(key => `${key}=${encodeURIComponent(route.query[key])}`)
        .join('&');

    const finalUrl = `${API_BASE}/api/auth/redirect?${queryString}`;

    try {
        const response = await axios.get(finalUrl, { withCredentials: true });
        if (response.status === 200) {
            store.user = response.data;
            router.push('/dashboard');
        }
    } catch (error) {
        console.error('Error in request:', error);
        router.push('/');
    }
});
</script>

<template>
    <div class="h-screen flex flex-col justify-center items-center">
        <p class="mb-4 text-lg font-semibold">Redirecting...</p>
        <img src="./images/rocus1.png" class="h-24" />
    </div>
</template>
