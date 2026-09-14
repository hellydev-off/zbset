<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { auth, currentUserId, logout } from "../store/auth";
import { theme, setThemeMode } from "../store/theme";
import { createOrGetChat, listChats, changePinChat } from "../api/chats";
import { ensureConnected, getSocket } from "../socket";
import { ripple } from "../utils/ripple";
import { messengerState, clearUnread } from "../store/messenger";
import Icon from "../components/Icon.vue";

const router = useRouter();
const route = useRoute();
const myId = currentUserId();

const chats = ref([]);
const listLoading = ref(false);
const error = ref("");
const search = ref("");

const showUserMenu = ref(false);
const showNewChat = ref(false);
const otherId = ref("");
const newChatType = ref("direct");
const newChatLoading = ref(false);
const newChatError = ref("");

const WIDTH_KEY = "msg_frontend_sidebar_width";
const COLLAPSED_KEY = "msg_frontend_sidebar_collapsed";
const MIN_WIDTH = 280;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 76;

const sidebarWidth = ref(Number(localStorage.getItem(WIDTH_KEY)) || 380);
const collapsed = ref(localStorage.getItem(COLLAPSED_KEY) === "1");
let resizing = false;

const activeChatId = computed(() =>
  route.name === "chat" ? Number(route.params.chatId) : null,
);

const filteredChats = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = q
    ? chats.value.filter((c) => {
        const others = otherParticipants(c).join(" ");
        const preview = c.last_message?.text || "";
        return (
          String(c.id).includes(q) ||
          others.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      })
    : chats.value;
  // закреплённые чаты — всегда наверху, как в Telegram
  return [...list].sort((a, b) => (b.is_pin ? 1 : 0) - (a.is_pin ? 1 : 0));
});

onMounted(async () => {
  await refresh();
  const socket = ensureConnected();
  socket.on("message:new", onChatUpdated);
  socket.on("message:delete", onChatUpdated);
  socket.on("chat:delete_chat", onChatHistoryDeleted);
  window.addEventListener("click", onWindowClick);
});

onUnmounted(() => {
  const socket = getSocket();
  socket.off("message:new", onChatUpdated);
  socket.off("message:delete", onChatUpdated);
  socket.off("chat:delete_chat", onChatHistoryDeleted);
  window.removeEventListener("click", onWindowClick);
  stopResize();
});

// см. подробный комментарий в ChatView.vue — сейчас payload у этого эмита
// приходит (null, null) из-за бага в chats.service.js/deleteChatHistory,
// так что на практике это пока no-op. Оставлено рабочим на случай, когда
// бэкенд починит форму ответа — тогда превью последнего сообщения в списке
// чатов будет само сбрасываться у всех участников.
function onChatHistoryDeleted(chat) {
  if (!chat) return;
  const idx = chats.value.findIndex((c) => c.id === chat.id);
  if (idx !== -1) chats.value[idx] = { ...chats.value[idx], ...chat };
}

const pinningId = ref(null);

async function togglePin(chat) {
  if (pinningId.value === chat.id) return;
  pinningId.value = chat.id;
  try {
    const updated = await changePinChat(chat.id, !chat.is_pin);
    const idx = chats.value.findIndex((c) => c.id === chat.id);
    if (idx !== -1) chats.value[idx] = { ...chats.value[idx], is_pin: updated.is_pin };
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    pinningId.value = null;
  }
}

function onWindowClick(e) {
  if (!e.target.closest(".user-menu-wrap")) showUserMenu.value = false;
  if (!e.target.closest(".new-chat-wrap")) showNewChat.value = false;
}

function onChatUpdated(_message, chat) {
  if (!chat) return;
  const idx = chats.value.findIndex((c) => c.id === chat.id);
  if (idx === -1) {
    chats.value.unshift(chat);
  } else {
    chats.value[idx] = chat;
  }
}

async function refresh() {
  listLoading.value = true;
  error.value = "";
  try {
    chats.value = await listChats(myId);
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    listLoading.value = false;
  }
}

async function submitNewChat() {
  newChatError.value = "";
  const parsedOtherId = Number(otherId.value);
  if (!otherId.value || Number.isNaN(parsedOtherId)) {
    newChatError.value = "Укажи числовой id собеседника";
    return;
  }
  newChatLoading.value = true;
  try {
    const chat = await createOrGetChat(myId, parsedOtherId, newChatType.value);
    await refresh();
    showNewChat.value = false;
    otherId.value = "";
    goToChat(chat.id);
  } catch (e) {
    newChatError.value = e.response?.data?.message || e.message;
  } finally {
    newChatLoading.value = false;
  }
}

function goToChat(chatId) {
  clearUnread(chatId);
  router.push({ name: "chat", params: { chatId: String(chatId) } });
}

function otherParticipants(chat) {
  return chat.participant_ids.filter((id) => id !== myId);
}

const CONTENT_LABELS = { photo: "📷 Фото", video: "🎥 Видео", audio: "🎤 Голосовое сообщение", file: "📄 Файл" };

function lastMessagePreview(chat) {
  const lm = chat.last_message;
  if (!lm || (!lm.text && !lm.content?.isContent)) return "Нет сообщений";
  const prefix = lm.sender_id === myId ? "Вы: " : "";
  return prefix + (lm.text || CONTENT_LABELS[lm.content?.type] || "Вложение");
}

function draftPreview(chatId) {
  return messengerState.drafts[chatId] || "";
}

function unreadCount(chatId) {
  return messengerState.unreadCounts[chatId] || 0;
}

function initials(chat) {
  const other = otherParticipants(chat)[0];
  return other !== undefined ? String(other).slice(0, 2) : "??";
}

function onLogout() {
  logout();
  router.push({ name: "login" });
}

// ---- resizable / collapsible сайдбар ----
function startResize() {
  if (collapsed.value) return;
  resizing = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", onResizeMove);
  window.addEventListener("mouseup", stopResize);
}

function onResizeMove(e) {
  if (!resizing) return;
  sidebarWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
}

function stopResize() {
  if (!resizing) return;
  resizing = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  window.removeEventListener("mousemove", onResizeMove);
  window.removeEventListener("mouseup", stopResize);
  localStorage.setItem(WIDTH_KEY, String(sidebarWidth.value));
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
  localStorage.setItem(COLLAPSED_KEY, collapsed.value ? "1" : "0");
}

const sidebarStyle = computed(() => ({
  width: (collapsed.value ? COLLAPSED_WIDTH : sidebarWidth.value) + "px",
}));

const themeOptions = [
  { mode: "system", icon: "monitor", title: "Как в системе" },
  { mode: "light", icon: "sun", title: "Светлая" },
  { mode: "dark", icon: "moon", title: "Тёмная" },
];
</script>

<template>
  <div class="shell">
    <aside
      class="sidebar"
      :class="{ collapsed, 'mobile-hidden': !!activeChatId }"
      :style="sidebarStyle"
    >
      <div class="sidebar-header">
        <div class="user-menu-wrap">
          <button class="avatar-btn" @click.stop="showUserMenu = !showUserMenu">
            {{ String(myId).slice(0, 2) }}
          </button>
          <div v-if="showUserMenu" class="user-menu">
            <div class="user-menu-email">{{ auth.payload?.email }}</div>
            <div class="theme-switch">
              <button
                v-for="opt in themeOptions"
                :key="opt.mode"
                class="theme-switch-btn"
                :class="{ active: theme.mode === opt.mode }"
                :title="opt.title"
                @click="setThemeMode(opt.mode)"
              >
                <Icon :name="opt.icon" :size="15" />
              </button>
            </div>
            <router-link
              class="user-menu-item"
              :to="{ name: 'sockets' }"
              @click="showUserMenu = false"
            >
              <Icon name="plug" :size="16" /> Сокеты
            </router-link>
            <button class="user-menu-item danger" @click="onLogout">
              <Icon name="logout" :size="16" /> Выйти
            </button>
          </div>
        </div>

        <h2 v-if="!collapsed">Чаты</h2>

        <div v-if="!collapsed" class="new-chat-wrap">
          <button class="icon-btn" title="Новый чат" @click.stop="showNewChat = !showNewChat">
            <Icon name="pencil" :size="18" />
          </button>
          <div v-if="showNewChat" class="new-chat-popover">
            <input v-model="otherId" placeholder="id собеседника" inputmode="numeric" />
            <select v-model="newChatType">
              <option value="direct">direct</option>
              <option value="ai_persona">ai_persona</option>
            </select>
            <button class="primary" :disabled="newChatLoading" @click="submitNewChat">
              {{ newChatLoading ? "..." : "Открыть" }}
            </button>
            <p v-if="newChatError" class="error">{{ newChatError }}</p>
          </div>
        </div>
      </div>

      <div v-if="!collapsed" class="search-row">
        <Icon name="search" :size="16" class="search-icon" />
        <input v-model="search" placeholder="Поиск" class="search-input" />
      </div>

      <div class="chat-list scroll-thin">
        <p v-if="!collapsed && !listLoading && filteredChats.length === 0" class="hint">
          {{ chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено" }}
        </p>
        <div
          v-for="c in filteredChats"
          :key="c.id"
          class="chat-item"
          role="button"
          tabindex="0"
          :class="{ active: c.id === activeChatId }"
          :title="collapsed ? otherParticipants(c).join(', ') : null"
          @mousedown="ripple"
          @click="goToChat(c.id)"
          @keydown.enter="goToChat(c.id)"
        >
          <span class="avatar">{{ initials(c) }}</span>
          <span v-if="!collapsed" class="chat-main">
            <span class="chat-title-row">
              <span class="chat-title">
                #{{ c.id }} · {{ otherParticipants(c).join(", ") || "—" }}
              </span>
              <Icon v-if="c.is_pin" name="pin" :size="12" class="chat-pin-mark" />
            </span>
            <span class="chat-preview">
              <template v-if="draftPreview(c.id)">
                <span class="chat-draft-label">Черновик:</span> {{ draftPreview(c.id) }}
              </template>
              <template v-else>{{ lastMessagePreview(c) }}</template>
            </span>
          </span>
          <span v-if="!collapsed && unreadCount(c.id) > 0" class="chat-unread-badge">
            {{ unreadCount(c.id) > 99 ? "99+" : unreadCount(c.id) }}
          </span>
          <button
            v-if="!collapsed"
            type="button"
            class="chat-pin-btn"
            :class="{ visible: c.is_pin }"
            :title="c.is_pin ? 'Открепить чат' : 'Закрепить чат'"
            :disabled="pinningId === c.id"
            @click.stop="togglePin(c)"
          >
            <Icon name="pin" :size="15" />
          </button>
        </div>
      </div>
    </aside>

    <div
      class="resize-handle"
      :class="{ collapsed }"
      @mousedown="startResize"
      @dblclick="toggleCollapse"
      :title="collapsed ? 'Развернуть' : 'Потяните, чтобы изменить ширину · двойной клик — свернуть'"
    ></div>

    <main class="main-pane" :class="{ 'mobile-hidden': !activeChatId }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg);
  overflow: hidden;
  transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.resize-handle {
  flex: 0 0 auto;
  width: 5px;
  cursor: col-resize;
  background: transparent;
  position: relative;
}

.resize-handle::after {
  content: "";
  position: absolute;
  inset: 0;
  right: 2px;
  width: 1px;
  background: var(--border);
}

.resize-handle:hover::after,
.resize-handle.collapsed:hover::after {
  background: var(--accent);
  width: 2px;
  right: 1.5px;
}

.resize-handle.collapsed {
  cursor: pointer;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 10px;
  min-height: 56px;
}

.sidebar.collapsed .sidebar-header {
  padding: 14px 0 10px;
  justify-content: center;
}

.sidebar-header h2 {
  flex: 1;
  font-size: 20px;
}

.avatar-btn {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0;
}

.icon-btn {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--bg-soft);
  color: var(--text-h);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.user-menu-wrap,
.new-chat-wrap {
  position: relative;
}

.user-menu {
  position: absolute;
  top: 42px;
  left: 0;
  z-index: 30;
  min-width: 210px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-elevated);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-menu-email {
  padding: 8px 10px 6px;
  font-size: 12px;
  opacity: 0.7;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
  word-break: break-all;
}

.theme-switch {
  display: flex;
  gap: 4px;
  padding: 4px 6px 8px;
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
  border-color: var(--accent-border, transparent);
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--text-h);
  text-decoration: none;
  font-size: 14px;
  text-align: left;
  width: 100%;
}

.user-menu-item:hover {
  background: var(--bg-soft);
}

.user-menu-item.danger {
  color: var(--danger);
}

.new-chat-popover {
  position: absolute;
  top: 42px;
  right: 0;
  z-index: 30;
  min-width: 240px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-elevated);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-row {
  position: relative;
  padding: 0 16px 10px;
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  border-radius: 20px;
  background: var(--bg-soft);
  border: 1px solid transparent;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sidebar.collapsed .chat-list {
  align-items: center;
  padding: 4px 8px 12px;
}

.hint {
  padding: 20px;
  text-align: center;
  font-size: 14px;
}

.chat-item {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: none;
  border: none;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.sidebar.collapsed .chat-item {
  width: 52px;
  min-height: 52px;
  padding: 0;
  justify-content: center;
}

.chat-item:hover {
  background: var(--bg-soft);
}

.chat-item.active {
  background: var(--accent-bg);
}

.chat-pin-mark {
  flex-shrink: 0;
  opacity: 0.6;
  color: var(--accent);
}

.chat-draft-label {
  color: var(--danger);
}

.chat-unread-badge {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-pin-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.chat-item:hover .chat-pin-btn,
.chat-pin-btn.visible {
  opacity: 1;
}

.chat-pin-btn.visible {
  color: var(--accent);
}

.avatar {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--accent-bg);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.sidebar.collapsed .avatar {
  width: 44px;
  height: 44px;
}

.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.chat-title {
  font-weight: 600;
  color: var(--text-h);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  min-width: 0;
}

.chat-preview {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.main-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* На мобильной ширине сайдбар и чат — отдельные "экраны": показываем
   только один в зависимости от того, открыт ли конкретный чат. */
@media (max-width: 768px) {
  .sidebar {
    width: 100% !important;
  }

  .sidebar.mobile-hidden,
  .main-pane.mobile-hidden {
    display: none;
  }

  .resize-handle {
    display: none;
  }
}
</style>
