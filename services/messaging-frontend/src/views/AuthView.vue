<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { setToken } from "../store/auth";
import { register, login, extractAuthError } from "../api/auth";

const router = useRouter();

const mode = ref("login"); // login | register
const loading = ref(false);
const error = ref("");

const loginForm = ref({ email: "", password: "" });
const registerForm = ref({ email: "", username: "", password: "", passwordConfirm: "" });

const showTokenPaste = ref(false);
const tokenInput = ref("");
const tokenError = ref("");

async function submitLogin() {
  error.value = "";
  loading.value = true;
  try {
    const { access_token, refresh_token } = await login(loginForm.value);
    setToken(access_token, refresh_token);
    router.push({ name: "feed" });
  } catch (e) {
    error.value = extractAuthError(e);
  } finally {
    loading.value = false;
  }
}

async function submitRegister() {
  error.value = "";
  const f = registerForm.value;
  if (f.password !== f.passwordConfirm) {
    error.value = "Пароли не совпадают";
    return;
  }
  loading.value = true;
  try {
    await register({ email: f.email, username: f.username, password: f.password });
    // регистрация не возвращает токены — логинимся тем же паролем сразу
    const { access_token, refresh_token } = await login({ email: f.email, password: f.password });
    setToken(access_token, refresh_token);
    router.push({ name: "feed" });
  } catch (e) {
    error.value = extractAuthError(e);
  } finally {
    loading.value = false;
  }
}

function submitTokenPaste() {
  tokenError.value = "";
  const value = tokenInput.value.trim();
  if (!value) {
    tokenError.value = "Вставь JWT-токен";
    return;
  }
  try {
    setToken(value);
    router.push({ name: "feed" });
  } catch (e) {
    tokenError.value = "Не удалось разобрать токен: " + e.message;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h2>{{ mode === "login" ? "Вход" : "Регистрация" }}</h2>

      <div class="tabs">
        <button type="button" :class="{ active: mode === 'login' }" @click="mode = 'login'; error = ''">
          Войти
        </button>
        <button type="button" :class="{ active: mode === 'register' }" @click="mode = 'register'; error = ''">
          Создать аккаунт
        </button>
      </div>

      <form v-if="mode === 'login'" class="form" @submit.prevent="submitLogin">
        <label>
          <span>Email</span>
          <input v-model="loginForm.email" type="email" required autocomplete="email" />
        </label>
        <label>
          <span>Пароль</span>
          <input v-model="loginForm.password" type="password" required autocomplete="current-password" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? "..." : "Войти" }}
        </button>
      </form>

      <form v-else class="form" @submit.prevent="submitRegister">
        <label>
          <span>Email</span>
          <input v-model="registerForm.email" type="email" required autocomplete="email" />
        </label>
        <label>
          <span>Никнейм</span>
          <input v-model="registerForm.username" required minlength="5" maxlength="50" autocomplete="username" />
        </label>
        <label>
          <span>Пароль</span>
          <input v-model="registerForm.password" type="password" required minlength="8" autocomplete="new-password" />
        </label>
        <label>
          <span>Повтори пароль</span>
          <input v-model="registerForm.passwordConfirm" type="password" required minlength="8" autocomplete="new-password" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? "..." : "Создать аккаунт" }}
        </button>
      </form>

      <button type="button" class="dev-toggle" @click="showTokenPaste = !showTokenPaste">
        {{ showTokenPaste ? "Скрыть" : "Войти по JWT-токену (для тестов)" }}
      </button>

      <div v-if="showTokenPaste" class="token-paste">
        <textarea
          v-model="tokenInput"
          rows="4"
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          @keydown.meta.enter="submitTokenPaste"
        ></textarea>
        <p v-if="tokenError" class="error">{{ tokenError }}</p>
        <button type="button" @click="submitTokenPaste">Войти токеном</button>
      </div>
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
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-soft);
  padding: 3px;
  border-radius: 10px;
}

.tabs button {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
}

.tabs button.active {
  background: var(--bg-elevated);
  color: var(--text-h);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form input {
  font-size: 14px;
}

.dev-toggle {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 0;
  text-align: center;
}

.token-paste {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-paste textarea {
  width: 100%;
  resize: vertical;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
}
</style>
