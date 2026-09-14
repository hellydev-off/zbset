import axios from "axios";
import { auth, setToken, logout } from "../store/auth";
import { refreshAccessToken } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// REST теперь тоже защищён authenticateToken (не только сокеты) —
// подставляем токен из auth-стора в каждый запрос.
api.interceptors.request.use((config) => {
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// access-токен auth-service живёт всего 15 минут — если сервер отклонил
// его как истёкший/невалидный (401/403), один раз пробуем обновить по
// refresh-токену и повторить запрос. Без этого пользователя выкидывало бы
// каждые 15 минут.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    if ((status === 401 || status === 403) && auth.refreshToken && !original._retried) {
      original._retried = true;
      try {
        refreshPromise ||= refreshAccessToken(auth.refreshToken).finally(() => {
          refreshPromise = null;
        });
        const { access_token } = await refreshPromise;
        setToken(access_token, auth.refreshToken);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch {
        logout();
      }
    }
    return Promise.reject(error);
  },
);
