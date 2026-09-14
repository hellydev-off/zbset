import { reactive } from "vue";
import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "msg_frontend_token";
const REFRESH_STORAGE_KEY = "msg_frontend_refresh_token";

const state = reactive({
  token: null,
  refreshToken: null,
  payload: null, // { id, sub, email, roles, session_id, iss, aud, ... }
});

// Два разных источника токенов сейчас совмещены в одном приложении:
// - старые ручные/тестовые токены (scripts/generateToken.js) несут поле "id"
// - настоящие токены auth-service (core-service, Django) несут "sub" (UUID)
// currentUserId() поэтому проверяет оба поля.
function hasUsableSubject(payload) {
  return payload?.id !== undefined || payload?.sub !== undefined;
}

function restore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const payload = jwtDecode(saved);
    if (!hasUsableSubject(payload)) return;
    state.token = saved;
    state.payload = payload;
    state.refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  }
}

restore();

export const auth = state;

export function setToken(token, refreshToken = null) {
  const payload = jwtDecode(token); // может бросить, если строка не JWT
  if (!hasUsableSubject(payload)) {
    throw new Error("В токене нет ни поля id, ни поля sub");
  }
  state.token = token;
  state.payload = payload;
  localStorage.setItem(STORAGE_KEY, token);

  if (refreshToken) {
    state.refreshToken = refreshToken;
    localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
  }
}

export function logout() {
  state.token = null;
  state.refreshToken = null;
  state.payload = null;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function currentUserId() {
  return state.payload?.id ?? state.payload?.sub ?? null;
}
