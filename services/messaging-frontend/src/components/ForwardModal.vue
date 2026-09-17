<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { listChats } from "../api/chats";
import { sendMessage } from "../api/messages";
import { currentUserId } from "../store/auth";
import Icon from "./Icon.vue";

const props = defineProps({
  message: { type: Object, required: true },
});
const emit = defineEmits(["close"]);

const router = useRouter();
const myId = currentUserId();

const chats = ref([]);
const loading = ref(true);
const search = ref("");
const sendingId = ref(null);
const sentId = ref(null);

onMounted(async () => {
  try {
    chats.value = await listChats(myId);
  } finally {
    loading.value = false;
  }
});

const filteredChats = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return chats.value;
  return chats.value.filter((c) => String(c.id).includes(q));
});

function otherParticipants(chat) {
  return chat.participant_ids.filter((id) => id !== myId);
}

// Content-схема сервера не знает про "пересылку" — это просто новое
// сообщение с тем же вложением и текстовой пометкой-маркером, честно и без
// выдумывания несуществующих полей на бэке.
async function forwardTo(chat) {
  if (sendingId.value) return;
  sendingId.value = chat.id;
  const marker = `↪ Переслано от #${props.message.sender_id}`;
  const text = props.message.text ? `${marker}\n${props.message.text}` : marker;
  try {
    await sendMessage({ chatId: chat.id, text, content: props.message.content || { isContent: false } });
    sentId.value = chat.id;
    setTimeout(() => {
      if (sentId.value === chat.id) emit("close");
    }, 600);
  } finally {
    sendingId.value = null;
  }
}

function goToChat(chat) {
  emit("close");
  router.push({ name: "chat", params: { chatId: String(chat.id) } });
}
</script>

<template>
  <div class="fwd-backdrop" @click.self="emit('close')">
    <div class="fwd-modal">
      <header class="fwd-header">
        <span>Переслать сообщение</span>
        <button type="button" class="fwd-close" @click="emit('close')"><Icon name="x" :size="20" /></button>
      </header>

      <div class="fwd-search">
        <Icon name="search" :size="15" />
        <input v-model="search" placeholder="Найти чат по id" />
      </div>

      <div class="fwd-list scroll-thin">
        <p v-if="loading" class="fwd-hint">Загрузка...</p>
        <p v-else-if="filteredChats.length === 0" class="fwd-hint">Чатов не найдено</p>
        <button
          v-for="c in filteredChats"
          :key="c.id"
          type="button"
          class="fwd-item"
          @click="forwardTo(c)"
        >
          <span class="fwd-avatar">{{ String(otherParticipants(c)[0] ?? "??").slice(0, 2) }}</span>
          <span class="fwd-title">#{{ c.id }} · {{ otherParticipants(c).join(", ") || "—" }}</span>
          <span v-if="sentId === c.id" class="fwd-status sent"><Icon name="check" :size="16" /></span>
          <span v-else-if="sendingId === c.id" class="fwd-status">...</span>
          <button v-else type="button" class="fwd-goto" title="Открыть чат" @click.stop="goToChat(c)">
            <Icon name="arrow-left" :size="14" class="flip" />
          </button>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fwd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.fwd-modal {
  width: 100%;
  max-width: 380px;
  max-height: 70vh;
  background: var(--bg-elevated);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fwd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  flex: 0 0 auto;
}

.fwd-close {
  border: none;
  background: none;
  color: var(--text-h);
  display: flex;
}

.fwd-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 14px;
  padding: 8px 12px;
  border-radius: 20px;
  background: var(--bg-soft);
  flex: 0 0 auto;
  opacity: 0.75;
}

.fwd-search input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13.5px;
}

.fwd-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
}

.fwd-hint {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 13.5px;
}

.fwd-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: none;
  background: none;
  padding: 9px 10px;
  border-radius: 10px;
  text-align: left;
}

.fwd-item:hover {
  background: var(--bg-soft);
}

.fwd-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-bg);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.fwd-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fwd-status {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.fwd-status.sent {
  color: var(--accent);
  display: flex;
}

.fwd-goto {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fwd-goto:hover {
  background: var(--bg-elevated);
  color: var(--text-h);
}

.flip {
  transform: rotate(180deg);
}
</style>
