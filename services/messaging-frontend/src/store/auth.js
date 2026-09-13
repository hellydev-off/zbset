import { reactive } from "vue";
import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "msg_frontend_token";

const state = reactive({
  token: null,
  payload: null, // { id, sub, email, roles, session_id, iss, aud, ... }
});

function restore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const payload = jwtDecode(saved);
    if (payload?.id === undefined) return;
    state.token = saved;
    state.payload = payload;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

restore();

export const auth = state;

export function setToken(token) {
  const payload = jwtDecode(token); // может бросить, если строка не JWT
  if (payload?.id === undefined) {
    throw new Error("В токене нет поля id");
  }
  state.token = token;
  state.payload = payload;
  localStorage.setItem(STORAGE_KEY, token);
}

export function logout() {
  state.token = null;
  state.payload = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function currentUserId() {
  return state.payload?.id ?? null;
}
