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
