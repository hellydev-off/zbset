import axios from "axios";
import { auth } from "../store/auth";

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
