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
