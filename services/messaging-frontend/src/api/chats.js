import { api } from "./client";

// POST /api/chat/create — единственный существующий на сервере метод по чатам.
// Он создаёт чат по паре participant_ids или возвращает уже существующий
// (совпадение ищется по пересечению participant_ids, см. chats.repository.js).
export async function createOrGetChat(myId, otherId, type = "direct") {
  const { data } = await api.post("/chat/create", {
    type,
    participant_ids: [myId, otherId],
  });
  return data;
}

// GET /api/chat/?id=<participant_id> — чаты, где participant_ids содержит id.
export async function listChats(userId) {
  const { data } = await api.get("/chat", { params: { id: userId } });
  return data;
}

// POST /api/chat/changePin — закрепить/открепить чат в списке (is_pin).
export async function changePinChat(chatId, pinned) {
  const { data } = await api.post("/chat/changePin", { chatId, station: pinned });
  return data;
}

// POST /api/chat/deleteChatHistory — удаляет ВСЕ сообщения чата и сбрасывает
// last_message/pin_message. Сервер также шлёт socket-эмит "chat:delete_chat",
// но сейчас он приходит с payload (null, null) — см. отчёт в чате с бэкендером,
// поэтому фронт не полагается на этот эмит для собственного действия
// пользователя, только опционально — для синхронизации у других участников.
export async function deleteChatHistory(chatId) {
  const { data } = await api.post("/chat/deleteChatHistory", { chatId });
  return data;
}
