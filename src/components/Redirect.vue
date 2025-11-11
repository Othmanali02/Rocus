<script setup>
import axios from 'axios';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
onMounted(async () => {
    let queryString = Object.keys(route.query)
        .map(key => `${key}=${encodeURIComponent(route.query[key])}`)
        .join('&');

    const finalUrl = "http://localhost:5000/auth/redirect?" + queryString;

    try {
        console.log("making the request");
        const response = await axios.get(finalUrl, { withCredentials: true });
        console.log(response);
        if (response.status === 200) {
            console.log('Redirecting...');

            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error in request:', error);
    }
});
</script>

<template>
    <div class="h-screen flex flex-col justify-center items-center">
        <p class="mb-4 text-lg font-semibold">Redirecting...</p>
        <img src="./images/rocus1.png" class="h-24" />
    </div>
</template>
