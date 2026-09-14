<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { currentUserId } from "../store/auth";
import { getChatMessages } from "../api/messages";
import { listChats } from "../api/chats";
import { ensureConnected, getSocket } from "../socket";

const props = defineProps({
  chatId: { type: String, required: true },
});

const myId = currentUserId();

const messages = ref([]);
const text = ref("");
const error = ref("");
const listEl = ref(null);
const socketStatus = ref("disconnected"); // disconnected | connecting | connected | error

const chatType = ref("direct");
const participantIds = ref([]);

const editingId = ref(null);
const editingText = ref("");

function scrollToBottom() {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  });
}

async function loadHistory() {
  try {
    const data = await getChatMessages(Number(props.chatId));
    messages.value = [...data].sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at),
    );
    scrollToBottom();
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  }
}

async function loadChatMeta() {
  try {
    const chats = await listChats(myId);
    const chat = chats.find((c) => c.id === Number(props.chatId));
    if (chat) {
      chatType.value = chat.type;
      participantIds.value = chat.participant_ids;
    }
  } catch {
    // список чатов не критичен для отправки — просто останутся дефолты
  }
}

function onMessageNew(message) {
  if (message.chat_id !== Number(props.chatId)) return;
  if (messages.value.some((m) => m.id === message.id)) return;
  messages.value.push(message);
  scrollToBottom();
}

// Пока на сервере message:update шлётся без await (см. operations/messages.js),
// сюда придёт {} без id — findIndex просто ничего не найдёт, это ок.
function onMessageUpdate(message) {
  const idx = messages.value.findIndex((m) => m.id === message.id);
  if (idx === -1) return;
  messages.value[idx] = { ...messages.value[idx], ...message };
}

function onSocketError(err) {
  error.value = err.message || "socket error";
}

let socket = null;

function joinChat() {
  socketStatus.value = "connecting";
  socket = ensureConnected();

  socket.on("connect", () => {
    socketStatus.value = "connected";
    socket.emit("chat:open", { chatId: Number(props.chatId) });
  });
  socket.on("disconnect", () => {
    socketStatus.value = "disconnected";
  });
  socket.on("connect_error", (err) => {
    socketStatus.value = "error";
    error.value = "Сокет: " + err.message;
  });
  socket.on("message:new", onMessageNew);
  socket.on("message:update", onMessageUpdate);
  socket.on("error", onSocketError);

  if (socket.connected) {
    socketStatus.value = "connected";
    socket.emit("chat:open", { chatId: Number(props.chatId) });
  }
}

function leaveChat() {
  if (!socket) return;
  socket.emit("chat:close", { chatId: Number(props.chatId) });
  socket.off("message:new", onMessageNew);
  socket.off("message:update", onMessageUpdate);
  socket.off("error", onSocketError);
  socket.off("connect");
  socket.off("disconnect");
  socket.off("connect_error");
}

function onSend() {
  const value = text.value.trim();
  if (!value || !socket || socketStatus.value !== "connected") return;
  error.value = "";
  socket.emit("message:send", {
    chatId: Number(props.chatId),
    type: chatType.value,
    participant_ids: participantIds.value,
    text: value,
  });
  text.value = "";
}

function startEdit(m) {
  if (m.sender_id !== myId) return;
  editingId.value = m.id;
  editingText.value = m.text;
}

function cancelEdit() {
  editingId.value = null;
  editingText.value = "";
}

function submitEdit() {
  const value = editingText.value.trim();
  if (!value || !socket || socketStatus.value !== "connected") return;
  socket.emit("message:update", {
    id: editingId.value,
    newMessage: value,
    chatId: Number(props.chatId),
  });
  cancelEdit();
}

async function openChat() {
  messages.value = [];
  await loadChatMeta();
  await loadHistory();
  joinChat();
}

onMounted(openChat);
onUnmounted(leaveChat);

watch(
  () => props.chatId,
  () => {
    leaveChat();
    openChat();
  },
);
</script>

<template>
  <div class="chat">
    <div class="header">
      <router-link :to="{ name: 'chats' }">&larr; Чаты</router-link>
      <span class="chat-id">Чат #{{ chatId }}</span>
      <span class="status" :class="socketStatus">{{ socketStatus }}</span>
    </div>

    <div ref="listEl" class="messages">
      <div
        v-for="m in messages"
        :key="m.id"
        class="bubble-row"
        :class="{ mine: m.sender_id === myId }"
      >
        <div class="bubble">
          <div class="meta">
            <span>{{ m.sender_type }} #{{ m.sender_id }}</span>
            <button
              v-if="m.sender_id === myId && editingId !== m.id"
              class="edit-btn"
              @click="startEdit(m)"
            >
              изменить
            </button>
          </div>

          <form v-if="editingId === m.id" class="edit-form" @submit.prevent="submitEdit">
            <input v-model="editingText" class="edit-input" />
            <button type="submit" class="edit-save">✓</button>
            <button type="button" class="edit-cancel" @click="cancelEdit">✕</button>
          </form>
          <div v-else class="text">
            {{ m.text }}
            <span v-if="m.updated_at" class="edited-mark">(ред.)</span>
          </div>

          <div class="time">{{ new Date(m.sent_at).toLocaleTimeString() }}</div>
        </div>
      </div>
      <p v-if="messages.length === 0" class="hint">Сообщений пока нет</p>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <form class="composer" @submit.prevent="onSend">
      <input
        v-model="text"
        placeholder="Сообщение..."
        :disabled="socketStatus !== 'connected'"
      />
      <button
        class="primary"
        type="submit"
        :disabled="socketStatus !== 'connected' || !text.trim()"
      >
        Отправить
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}

.header a {
  color: var(--text);
  text-decoration: none;
}

.chat-id {
  font-weight: 600;
  color: var(--text-h);
}

.status {
  margin-left: auto;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--bg-soft);
}

.status.connected {
  background: var(--accent-bg);
  color: var(--accent);
}

.status.error {
  color: var(--danger);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-row {
  display: flex;
}

.bubble-row.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--bubble-other);
  color: var(--bubble-other-text);
}

.bubble-row.mine .bubble {
  background: var(--bubble-mine);
  color: var(--bubble-mine-text);
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 2px;
}

.edit-btn {
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  text-decoration: underline;
  opacity: 0.8;
  color: inherit;
}

.edited-mark {
  font-size: 11px;
  opacity: 0.6;
}

.edit-form {
  display: flex;
  gap: 6px;
  align-items: center;
}

.edit-input {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  padding: 4px 6px;
}

.edit-save,
.edit-cancel {
  padding: 2px 8px;
}

.time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
  text-align: right;
}

.hint {
  text-align: center;
  font-size: 14px;
}

.composer {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
}

.composer input {
  flex: 1;
}
</style>
