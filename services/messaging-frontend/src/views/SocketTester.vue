<script setup>
import { ref, onUnmounted, computed } from "vue";
import { io } from "socket.io-client";
import { auth } from "../store/auth";

const serverUrl = ref(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000");
const token = ref(auth.token || "");

const status = ref("disconnected"); // disconnected | connecting | connected | error
const statusDetail = ref("");
const log = ref([]);
const incomingMessages = ref([]);

let socket = null;

const chatIdForOpen = ref("");
const chatIdForClose = ref("");
const chatIdForMessage = ref("");
const chatTypeForMessage = ref("direct");
const participantIdsForMessage = ref("");
const messageText = ref("");
const hasContent = ref(false);
const contentType = ref("photo");
const contentUrl = ref("");
const chatIdForTyping = ref("");

const messageIdForUpdate = ref("");
const newTextForUpdate = ref("");
const chatIdForUpdate = ref("");

const customEventName = ref("");
const customPayload = ref("{}");

const isConnected = computed(() => status.value === "connected");

function pushLog(direction, event, payload) {
  log.value.push({
    id: Date.now() + Math.random(),
    ts: new Date().toLocaleTimeString(),
    direction, // "in" | "out" | "system"
    event,
    payload,
  });
  if (log.value.length > 500) log.value.shift();
}

function connect() {
  if (socket) return;
  status.value = "connecting";
  statusDetail.value = "";
  pushLog("system", "connect:attempt", { url: serverUrl.value });

  socket = io(serverUrl.value, {
    auth: { token: token.value },
    autoConnect: true,
  });

  socket.on("connect", () => {
    status.value = "connected";
    pushLog("system", "connect", { id: socket.id });
  });

  socket.on("disconnect", (reason) => {
    status.value = "disconnected";
    pushLog("system", "disconnect", { reason });
  });

  socket.on("connect_error", (err) => {
    status.value = "error";
    statusDetail.value = err.message;
    pushLog("system", "connect_error", { message: err.message });
  });

  // Логируем ЛЮБОЕ входящее событие, независимо от того, знаем мы его имя или нет —
  // протокол сокетов ещё пишется на сервере и может меняться.
  socket.onAny((event, ...args) => {
    pushLog("in", event, args.length === 1 ? args[0] : args);
  });

  // message:new — отдельно от общего лога, чтобы видеть входящие сообщения
  // как ленту, а не искать их среди остальных событий.
  socket.on("message:new", (message) => {
    incomingMessages.value.unshift(message);
  });
}

function disconnect() {
  if (!socket) return;
  socket.disconnect();
  socket.offAny();
  socket = null;
  status.value = "disconnected";
}

function emit(event, payload) {
  if (!socket || !isConnected.value) {
    pushLog("system", "emit:skipped (нет соединения)", { event, payload });
    return;
  }
  socket.emit(event, payload);
  pushLog("out", event, payload);
}

function openChat() {
  const chatId = Number(chatIdForOpen.value);
  if (Number.isNaN(chatId)) return;
  emit("chat:open", { chatId });
}

function closeChat() {
  const chatId = Number(chatIdForClose.value);
  if (Number.isNaN(chatId)) return;
  emit("chat:close", { chatId });
}

// Полная форма сообщения — по примеру мока contracts/mock-data/chat.yaml
// (type, messageType, isViewed, content{isContent,type,url}). chatId оставлен
// как есть — это единственное поле, которое реально читает текущий хендлер
// message:send на сервере, остальное — для ручного тестирования будущей логики.
function sendMessage() {
  const chatId = Number(chatIdForMessage.value);
  if (Number.isNaN(chatId) || !messageText.value.trim()) return;
  const participant_ids = participantIdsForMessage.value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  emit("message:send", {
    chatId,
    type: chatTypeForMessage.value,
    participant_ids,
    text: messageText.value,
    messageType: "outgoing",
    isViewed: false,
    content: {
      isContent: hasContent.value,
      type: hasContent.value ? contentType.value : null,
      url: hasContent.value ? contentUrl.value : null,
    },
  });
  messageText.value = "";
}

function updateMessage() {
  const id = Number(messageIdForUpdate.value);
  const chatId = Number(chatIdForUpdate.value);
  if (Number.isNaN(id) || Number.isNaN(chatId) || !newTextForUpdate.value.trim()) return;
  emit("message:update", { id, newMessage: newTextForUpdate.value, chatId });
}

function startTyping() {
  const chatId = Number(chatIdForTyping.value);
  if (Number.isNaN(chatId)) return;
  emit("typing:start", { chatId });
}

function emitCustom() {
  if (!customEventName.value.trim()) return;
  let payload;
  try {
    payload = customPayload.value.trim() ? JSON.parse(customPayload.value) : undefined;
  } catch (e) {
    pushLog("system", "emit:json-error", { message: e.message });
    return;
  }
  emit(customEventName.value.trim(), payload);
}

function clearLog() {
  log.value = [];
}

function clearIncoming() {
  incomingMessages.value = [];
}

function formatPayload(payload) {
  if (payload === undefined) return "";
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

onUnmounted(disconnect);
</script>

<template>
  <div class="wrap">
    <section class="connection">
      <h3>Соединение</h3>
      <div class="row">
        <input v-model="serverUrl" placeholder="http://localhost:3000" :disabled="isConnected" />
      </div>
      <div class="row">
        <textarea
          v-model="token"
          rows="2"
          placeholder="JWT токен (socket.handshake.auth.token, сервер его ПРОВЕРЯЕТ подписью)"
          :disabled="isConnected"
        ></textarea>
      </div>
      <div class="row">
        <button v-if="!isConnected" class="primary" @click="connect">Подключиться</button>
        <button v-else @click="disconnect">Отключиться</button>
        <span class="status" :class="status">{{ status }}</span>
        <span v-if="statusDetail" class="error">{{ statusDetail }}</span>
      </div>
    </section>

    <section class="actions">
      <h3>Известные события</h3>

      <div class="action-row">
        <code>chat:open</code>
        <input v-model="chatIdForOpen" placeholder="chatId" inputmode="numeric" />
        <button @click="openChat" :disabled="!isConnected">Отправить</button>
      </div>

      <div class="action-row">
        <code>chat:close</code>
        <input v-model="chatIdForClose" placeholder="chatId" inputmode="numeric" />
        <button @click="closeChat" :disabled="!isConnected">Отправить</button>
      </div>

      <div class="msg-form">
        <div class="action-row">
          <code>message:send</code>
          <input v-model="chatIdForMessage" placeholder="chatId" inputmode="numeric" />
          <select v-model="chatTypeForMessage">
            <option value="direct">direct</option>
            <option value="ai_persona">ai_persona</option>
          </select>
        </div>
        <div class="action-row">
          <input
            v-model="participantIdsForMessage"
            placeholder="participant_ids, напр. 1,2"
            class="grow"
          />
        </div>
        <div class="action-row">
          <input
            v-model="messageText"
            placeholder="text"
            class="grow"
            @keydown.enter="sendMessage"
          />
        </div>
        <div class="action-row">
          <label class="checkbox">
            <input type="checkbox" v-model="hasContent" />
            есть контент (фото/видео/аудио)
          </label>
          <select v-model="contentType" :disabled="!hasContent">
            <option value="photo">photo</option>
            <option value="video">video</option>
            <option value="audio">audio</option>
          </select>
          <input v-model="contentUrl" placeholder="url" class="grow" :disabled="!hasContent" />
        </div>
        <div class="action-row">
          <button class="primary" @click="sendMessage" :disabled="!isConnected">
            Отправить message:send
          </button>
        </div>
      </div>

      <div class="msg-form">
        <div class="action-row">
          <code>message:update</code>
          <input v-model="messageIdForUpdate" placeholder="id сообщения" inputmode="numeric" />
          <input v-model="chatIdForUpdate" placeholder="chatId" inputmode="numeric" />
        </div>
        <div class="action-row">
          <input v-model="newTextForUpdate" placeholder="новый текст" class="grow" />
        </div>
        <div class="action-row">
          <button class="primary" @click="updateMessage" :disabled="!isConnected">
            Отправить message:update
          </button>
        </div>
      </div>

      <div class="action-row">
        <code>typing:start</code>
        <input v-model="chatIdForTyping" placeholder="chatId" inputmode="numeric" />
        <button @click="startTyping" :disabled="!isConnected">Отправить</button>
      </div>

      <h3>Произвольное событие</h3>
      <div class="action-row">
        <input v-model="customEventName" placeholder="имя события" />
      </div>
      <div class="action-row">
        <textarea v-model="customPayload" rows="3" placeholder="JSON payload, напр. {&quot;chatId&quot;:1}"></textarea>
        <button @click="emitCustom" :disabled="!isConnected">emit</button>
      </div>
    </section>

    <section class="incoming-section">
      <div class="log-header">
        <h3>Входящие message:new</h3>
        <button @click="clearIncoming">Очистить</button>
      </div>
      <div class="incoming-list">
        <div v-for="m in incomingMessages" :key="m.id ?? m.sent_at" class="incoming-item">
          <div class="incoming-meta">
            <span>chat #{{ m.chat_id ?? m.chatId }}</span>
            <span>{{ m.sender_type }} #{{ m.sender_id }}</span>
            <span v-if="m.sent_at">{{ new Date(m.sent_at).toLocaleTimeString() }}</span>
          </div>
          <div class="incoming-text">{{ m.text }}</div>
          <pre v-if="m.content" class="log-payload">{{ formatPayload(m.content) }}</pre>
        </div>
        <p v-if="incomingMessages.length === 0" class="hint">
          Пока ничего не пришло — отправь message:send и жди эмита message:new
        </p>
      </div>
    </section>

    <section class="log-section">
      <div class="log-header">
        <h3>Лог событий</h3>
        <button @click="clearLog">Очистить</button>
      </div>
      <div class="log">
        <div v-for="entry in log" :key="entry.id" class="log-entry" :class="entry.direction">
          <span class="log-ts">{{ entry.ts }}</span>
          <span class="log-dir">{{ entry.direction === "in" ? "←" : entry.direction === "out" ? "→" : "•" }}</span>
          <span class="log-event">{{ entry.event }}</span>
          <pre v-if="entry.payload !== undefined" class="log-payload">{{ formatPayload(entry.payload) }}</pre>
        </div>
        <p v-if="log.length === 0" class="hint">Пока пусто — подключись и что-нибудь отправь</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

h3 {
  margin-bottom: 8px;
}

.row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.row input,
.row textarea {
  flex: 1;
}

textarea {
  width: 100%;
  resize: vertical;
  font-family: var(--mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
}

.status {
  font-size: 12px;
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

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.action-row code {
  min-width: 110px;
  font-size: 12px;
  background: var(--bg-soft);
  padding: 4px 8px;
  border-radius: 6px;
}

.action-row input {
  flex: 1;
  min-width: 0;
}

.action-row textarea {
  flex: 1;
}

.action-row .grow {
  flex: 1;
  min-width: 0;
}

.action-row select {
  flex: 0 0 auto;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
}

.msg-form {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 16px;
}

.msg-form .action-row:last-child {
  margin-bottom: 0;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.incoming-list {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.incoming-item {
  border-left: 3px solid var(--accent);
  background: var(--bg-soft);
  border-radius: 6px;
  padding: 8px 10px;
}

.incoming-meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.incoming-text {
  font-size: 14px;
  color: var(--text-h);
}

.log {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  max-height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.log-entry {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px;
  align-items: start;
  padding: 4px 6px;
  border-radius: 6px;
  background: var(--bg-soft);
}

.log-entry.in {
  border-left: 3px solid var(--accent);
}

.log-entry.out {
  border-left: 3px solid #2ea043;
}

.log-entry.system {
  border-left: 3px solid var(--border);
  opacity: 0.8;
}

.log-ts {
  font-size: 11px;
  opacity: 0.6;
  white-space: nowrap;
}

.log-event {
  font-weight: 600;
  color: var(--text-h);
}

.log-payload {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--mono, ui-monospace, Consolas, monospace);
}

.hint {
  font-size: 13px;
  text-align: center;
  padding: 12px;
}
</style>
