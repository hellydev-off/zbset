import axios from "axios";

// core-service (Django) — отдельный сервис со своим base URL, не тот же
// backend, что messaging (api/client.js). В проде нгинкс проксирует его
// под /auth/, локально по умолчанию бьём напрямую в дев-сервер Django.
const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:8000/auth",
  headers: { "Content-Type": "application/json" },
});

// DRF возвращает ошибки валидации как { field: ["сообщение", ...], ... } —
// собираем это в одну читаемую строку для показа пользователю.
export function extractAuthError(err) {
  const data = err.response?.data;
  if (!data) return err.message;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const parts = Object.entries(data).map(([field, messages]) => {
    const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
    return field === "non_field_errors" ? text : `${field}: ${text}`;
  });
  return parts.join("; ") || "Неизвестная ошибка";
}

export async function register({ email, username, password }) {
  const { data } = await authApi.post("/register/", { email, username, password });
  return data;
}

// Регистрация не возвращает токены — сразу логинимся тем же паролем.
export async function login({ email, password }) {
  const { data } = await authApi.post("/login/", { email, password });
  return data; // { access_token, refresh_token }
}

export async function refreshAccessToken(refreshToken) {
  const { data } = await authApi.post("/refresh/", { refresh_token: refreshToken });
  return data; // { access_token }
}
