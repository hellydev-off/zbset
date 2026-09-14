<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { setToken } from "../store/auth";

const router = useRouter();
const tokenInput = ref("");
const error = ref("");

function submit() {
  error.value = "";
  const value = tokenInput.value.trim();
  if (!value) {
    error.value = "Вставь JWT-токен";
    return;
  }
  try {
    setToken(value);
    router.push({ name: "chats" });
  } catch (e) {
    error.value = "Не удалось разобрать токен: " + e.message;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h2>Введите JWT токен</h2>
      <p class="hint">
        Токен разбирается локально в браузере (без обращения к auth-service),
        из него берётся поле <code>id</code> — это и есть текущий пользователь.
      </p>
      <textarea
        v-model="tokenInput"
        rows="6"
        placeholder="eyJhbGciOiJIUzI1NiIs..."
        @keydown.meta.enter="submit"
      ></textarea>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="primary" @click="submit">Войти</button>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  font-size: 14px;
}

textarea {
  width: 100%;
  resize: vertical;
  font-family: var(--mono, ui-monospace, Consolas, monospace);
  font-size: 13px;
}
</style>
