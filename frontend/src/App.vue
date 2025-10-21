<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  // Initialize auth state from localStorage
  authStore.initializeAuth();
});
</script>

<style>
/* Global styles are imported in main.js */
</style>
