<script setup>
import { auth, logout } from "./store/auth";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

function onLogout() {
  logout();
  router.push({ name: "login" });
}
</script>

<template>
  <header v-if="auth.token" class="topbar">
    <nav class="nav">
      <router-link :to="{ name: 'chats' }" class="brand">Мессенджер</router-link>
      <router-link :to="{ name: 'sockets' }" class="nav-link">Сокеты</router-link>
    </nav>
    <div class="who">
      <span>{{ auth.payload?.email }} (id: {{ auth.payload?.id }})</span>
      <button @click="onLogout">Выйти</button>
    </div>
  </header>
  <main class="content" :key="route.fullPath">
    <router-view />
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}

.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  color: var(--text-h);
  font-weight: 600;
  text-decoration: none;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
}

.nav-link.router-link-active {
  color: var(--accent);
}

.who {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
