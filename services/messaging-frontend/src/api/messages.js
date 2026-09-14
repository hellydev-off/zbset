import axios from "axios";
import { api } from "./client";

// GET /api/message/getChatMessages валидирует chat_id из body (не из query!).
// Реальные браузеры вырезают body у GET-запросов, поэтому вместо прямого
// обращения к backend идём через dev-прокси в vite.config.js — там же
// объяснение, зачем он нужен.
export async function getChatMessages(chatId) {
  const { data } = await axios.get("/dev-proxy/get-chat-messages", {
    params: { chat_id: chatId },
  });
  return data;
}

// content обязателен в схеме сервера (z.object() без .optional()),
// поэтому если содержимого нет — шлём пустой объект.
export async function sendMessage({
  chatId,
  senderId,
  senderType = "user",
  text,
  content = {},
}) {
  const { data } = await api.post("/message/sendMessage", {
    chat_id: chatId,
    sender_id: senderId,
    sender_type: senderType,
    text,
    content,
  });
  return data;
}
