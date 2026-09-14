import { api } from "./client";

// Бэк отдаёт url вложения относительным (напр. "/files/chats/18/x.png"),
// в браузере это резолвится в origin фронта (5173), а не бэка (3000).
const mediaOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "");

export function resolveMediaUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//.test(url)) return url;
  return mediaOrigin + url;
}

// multer.single("file") на сервере — поле формы обязательно "file".
export async function uploadAttachment(chatId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/file/${chatId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// content.type у сообщения — на бэке это просто z.object() без схемы, сервер
// хранит content как есть. "photo"/"video"/"audio" — типы, которые понимает
// bubble на фронте нативно; "file" (application/pdf) — наш собственный,
// чисто клиентский тип для карточки файла (сервер про него ничего не знает
// и знать не должен, он просто прокидывает JSON).
export function mediaTypeFromMime(mime) {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "file";
  return null;
}
