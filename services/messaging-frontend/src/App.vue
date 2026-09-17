<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <main class="content" :key="route.fullPath">
    <router-view />
  </main>
</template>

<style scoped>
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
