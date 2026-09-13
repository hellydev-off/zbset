<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { currentUserId } from "../store/auth";
import { createOrGetChat, listChats } from "../api/chats";

const router = useRouter();
const myId = currentUserId();

const chats = ref([]);
const otherId = ref("");
const type = ref("direct");
const loading = ref(false);
const listLoading = ref(false);
const error = ref("");

onMounted(refresh);

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

async function openChat() {
  error.value = "";
  const parsedOtherId = Number(otherId.value);
  if (!otherId.value || Number.isNaN(parsedOtherId)) {
    error.value = "Укажи числовой id собеседника";
    return;
  }
  loading.value = true;
  try {
    const chat = await createOrGetChat(myId, parsedOtherId, type.value);
    await refresh();
    goToChat(chat.id);
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

function goToChat(chatId) {
  router.push({ name: "chat", params: { chatId: String(chatId) } });
}

function otherParticipants(chat) {
  return chat.participant_ids.filter((id) => id !== myId);
}
</script>

<template>
  <div class="wrap">
    <section class="new-chat">
      <h3>Открыть / создать чат</h3>
      <div class="row">
        <input v-model="otherId" placeholder="id собеседника" inputmode="numeric" />
        <select v-model="type">
          <option value="direct">direct</option>
          <option value="ai_persona">ai_persona</option>
        </select>
        <button class="primary" :disabled="loading" @click="openChat">
          {{ loading ? "..." : "Открыть" }}
        </button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section class="list">
      <div class="list-header">
        <h3>Мои чаты</h3>
        <button @click="refresh" :disabled="listLoading">
          {{ listLoading ? "..." : "Обновить" }}
        </button>
      </div>
      <p v-if="!listLoading && chats.length === 0" class="hint">Чатов пока нет</p>
      <ul>
        <li v-for="c in chats" :key="c.id">
          <button class="chat-item" @click="goToChat(c.id)">
            <span class="chat-id">#{{ c.id }}</span>
            <span class="chat-type">{{ c.type }}</span>
            <span class="chat-participants">
              собеседник: {{ otherParticipants(c).join(", ") || "—" }}
              <template v-if="c.persona_id">, persona: {{ c.persona_id }}</template>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.row {
  display: flex;
  gap: 8px;
}

.row input {
  flex: 1;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 14px;
}

ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  background: var(--bg-soft);
}

.chat-id {
  font-weight: 600;
  color: var(--text-h);
}

.chat-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--accent-bg);
  color: var(--accent);
}

.chat-participants {
  margin-left: auto;
  font-size: 13px;
}
</style>
