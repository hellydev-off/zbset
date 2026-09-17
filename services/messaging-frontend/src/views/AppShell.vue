<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { logout, currentUserId } from "../store/auth";
import { theme, setThemeMode } from "../store/theme";
import { social } from "../store/social";
import { messengerState, incrementUnread, setActiveChat } from "../store/messenger";
import { ensureConnected } from "../socket";
import {
  requestNotifyPermission,
  notifyNewMessage,
  playNotifySound,
  isSoundEnabled,
  setSoundEnabled,
} from "../utils/notify";
import Icon from "../components/Icon.vue";
import CreatePostModal from "../components/CreatePostModal.vue";

const route = useRoute();
const router = useRouter();
const showUserMenu = ref(false);
const myId = currentUserId();
const soundEnabled = ref(isSoundEnabled());

function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
  setSoundEnabled(soundEnabled.value);
}

// Глобальный (на весь залогиненный сеанс, а не только пока открыт конкретный
// чат) слушатель новых сообщений — считает непрочитанные, звенит и шлёт
// нотификации, даже когда человек сейчас на Ленте/в Профиле.
function onGlobalMessageNew(message) {
  if (message.sender_id === myId) return;
  const chatId = message.chat_id;
  const isOpenAndVisible = messengerState.activeChatId === chatId && document.visibilityState === "visible";
  if (isOpenAndVisible) return;
  incrementUnread(chatId);
  playNotifySound();
  notifyNewMessage(message, () => {
    setActiveChat(chatId);
    router.push({ name: "chat", params: { chatId: String(chatId) } });
  });
}

let globalSocket = null;

onMounted(() => {
  requestNotifyPermission();
  globalSocket = ensureConnected();
  globalSocket.on("message:new", onGlobalMessageNew);
});

function isActive(section) {
  if (section === "chats") return route.path.startsWith("/chats");
  if (section === "profile") return route.path.startsWith("/profile");
  return route.name === section;
}

function goProfile() {
  router.push({ name: "profile", params: { username: social.me.username } });
}

function onLogout() {
  logout();
  router.push({ name: "login" });
}

function onWindowClick(e) {
  if (!e.target.closest(".nav-user-wrap")) showUserMenu.value = false;
}

onMounted(() => window.addEventListener("click", onWindowClick));
onUnmounted(() => {
  window.removeEventListener("click", onWindowClick);
  globalSocket?.off("message:new", onGlobalMessageNew);
});

const themeOptions = [
  { mode: "system", icon: "monitor", title: "Как в системе" },
  { mode: "light", icon: "sun", title: "Светлая" },
  { mode: "dark", icon: "moon", title: "Тёмная" },
];
</script>

<template>
  <div class="app-shell">
    <aside class="nav">
      <router-link :to="{ name: 'feed' }" class="nav-logo">Соцсеть</router-link>

      <nav class="nav-items">
        <router-link :to="{ name: 'feed' }" class="nav-item" :class="{ active: isActive('feed') }">
          <Icon name="home" :size="24" />
          <span class="nav-label">Главная</span>
        </router-link>

        <router-link :to="{ name: 'chats' }" class="nav-item" :class="{ active: isActive('chats') }">
          <Icon name="message-circle" :size="24" />
          <span class="nav-label">Сообщения</span>
        </router-link>

        <button type="button" class="nav-item" @click="social.createPostOpen = true">
          <Icon name="plus-square" :size="24" />
          <span class="nav-label">Создать</span>
        </button>

        <button type="button" class="nav-item" :class="{ active: isActive('profile') }" @click="goProfile">
          <img :src="social.me.avatar" class="nav-avatar" />
          <span class="nav-label">Профиль</span>
        </button>
      </nav>

      <div class="nav-user-wrap">
        <button type="button" class="nav-item" @click.stop="showUserMenu = !showUserMenu">
          <Icon name="settings" :size="22" />
          <span class="nav-label">Ещё</span>
        </button>
        <div v-if="showUserMenu" class="nav-user-menu">
          <div class="theme-switch">
            <button
              v-for="opt in themeOptions"
              :key="opt.mode"
              type="button"
              class="theme-switch-btn"
              :class="{ active: theme.mode === opt.mode }"
              :title="opt.title"
              @click="setThemeMode(opt.mode)"
            >
              <Icon :name="opt.icon" :size="15" />
            </button>
          </div>
          <button type="button" class="nav-user-menu-item" @click="toggleSound">
            <Icon name="bell" :size="16" /> Звук уведомлений
            <span class="nav-user-menu-spacer"></span>
            <span class="sound-toggle" :class="{ on: soundEnabled }">{{ soundEnabled ? "Вкл" : "Выкл" }}</span>
          </button>
          <button type="button" class="nav-user-menu-item danger" @click="onLogout">
            <Icon name="logout" :size="16" /> Выйти
          </button>
        </div>
      </div>
    </aside>

    <div class="app-main">
      <router-view />
    </div>

    <nav v-if="!route.path.startsWith('/chats')" class="mobile-tabbar">
      <router-link :to="{ name: 'feed' }" class="tab-item" :class="{ active: isActive('feed') }">
        <Icon name="home" :size="24" />
      </router-link>
      <router-link :to="{ name: 'chats' }" class="tab-item" :class="{ active: isActive('chats') }">
        <Icon name="message-circle" :size="24" />
      </router-link>
      <button type="button" class="tab-item" @click="social.createPostOpen = true">
        <Icon name="plus-square" :size="24" />
      </button>
      <button type="button" class="tab-item" :class="{ active: isActive('profile') }" @click="goProfile">
        <img :src="social.me.avatar" class="tab-avatar" />
      </button>
    </nav>

    <CreatePostModal v-if="social.createPostOpen" @close="social.createPostOpen = false" />
  </div>
</template>

<style scoped>
.app-shell {
  flex: 1;
  display: flex;
  min-height: 0;
}

.nav {
  flex: 0 0 auto;
  width: 84px;
  display: flex;
  flex-direction: column;
  padding: 18px 0;
  border-right: 1px solid var(--border);
  background: var(--bg);
}

.nav-logo {
  display: none;
  padding: 0 20px 24px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-h);
  text-decoration: none;
}

.nav-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 56px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: none;
  color: var(--text-h);
  text-decoration: none;
  padding: 0;
  justify-content: center;
}

.nav-item:hover {
  background: var(--bg-soft);
}

.nav-item.active {
  color: var(--accent);
}

.nav-label {
  display: none;
  font-size: 15px;
}

.nav-avatar,
.tab-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.nav-item.active .nav-avatar {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.nav-user-wrap {
  position: relative;
  display: flex;
  justify-content: center;
}

.nav-user-menu {
  position: absolute;
  bottom: 0;
  left: 64px;
  z-index: 30;
  min-width: 200px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-elevated);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-switch {
  display: flex;
  gap: 4px;
  padding: 2px 4px 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.theme-switch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  border-radius: 6px;
  border: 1px solid transparent;
  background: var(--bg-soft);
  color: var(--text);
}

.theme-switch-btn.active {
  background: var(--accent-bg);
  color: var(--accent);
}

.nav-user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--text-h);
  font-size: 14px;
  text-align: left;
  width: 100%;
}

.nav-user-menu-item.danger {
  color: var(--danger);
}

.nav-user-menu-spacer {
  flex: 1;
}

.sound-toggle {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.sound-toggle.on {
  color: var(--accent);
}

.nav-user-menu-item:hover {
  background: var(--bg-soft);
}

.app-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-tabbar {
  display: none;
}

@media (min-width: 1280px) {
  .nav {
    width: 240px;
    align-items: stretch;
    padding: 18px 12px;
  }

  .nav-logo {
    display: block;
  }

  .nav-items {
    align-items: stretch;
  }

  .nav-item {
    width: 100%;
    justify-content: flex-start;
    padding: 0 12px;
  }

  .nav-label {
    display: inline;
  }

  .nav-user-wrap {
    justify-content: stretch;
  }

  .nav-user-menu {
    left: 0;
    bottom: 52px;
  }
}

@media (max-width: 768px) {
  .nav {
    display: none;
  }

  .app-shell {
    flex-direction: column;
  }

  .mobile-tabbar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-around;
    height: 54px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    order: 2;
  }

  .app-main {
    order: 1;
  }

  .tab-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: none;
    color: var(--text-h);
    text-decoration: none;
    padding: 0;
  }

  .tab-item.active {
    color: var(--accent);
  }

  .tab-item.active .tab-avatar {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
}
</style>
