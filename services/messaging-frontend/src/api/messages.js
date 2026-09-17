import axios from "axios";
import { api } from "./client";
import { auth } from "../store/auth";

// GET /api/message/getChatMessages валидирует chat_id из body (не из query!).
// Реальные браузеры вырезают body у GET-запросов, поэтому вместо прямого
// обращения к backend идём через dev-прокси в vite.config.js — там же
// объяснение, зачем он нужен. Этот запрос идёт мимо `api`-инстанса (на сам
// Vite dev-сервер), поэтому Authorization подставляем вручную.
export async function getChatMessages(chatId) {
  const { data } = await axios.get("/dev-proxy/get-chat-messages", {
    params: { chat_id: chatId },
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
  });
  return data;
}

// Отправка сообщения теперь идёт через REST, а не через сокет —
// message:new всё равно приходит через сокет, сервер сам его рассылает
// после создания сообщения (см. messages.controller.js). sender_id/type
// сервер берёт из авторизованного пользователя, в body их больше не шлём.
export async function sendMessage({ chatId, text, content = {} }) {
  const { data } = await api.post("/message/sendMessage", {
    chatId,
    text,
    content,
  });
  return data;
}
