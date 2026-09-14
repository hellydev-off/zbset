// modules/attachments/attachments.service.js
import { randomUUID } from "crypto";
import path from "path";
import * as attachmentsRepository from "./attachments.repository.js";
import { storage } from "../../lib/storage/index.js"; // абстракция диск/S3

export async function saveAttachment({ chatId, uploaderId, file }) {
  // 1. Генерируем безопасное имя файла — НИКОГДА не используем
  //    оригинальное имя напрямую (см. раздел 7 про path traversal).
  const ext = path.extname(file.originalname).toLowerCase();
  const safeFileName = `${randomUUID()}${ext}`;

  // 2. Пишем сам файл через абстракцию хранилища.
  const { url } = await storage.upload({
    key: `chats/${chatId}/${safeFileName}`,
    buffer: file.buffer,
    contentType: file.mimetype,
  });

  // 3. Записываем метаданные в БД — url файла НИКОГДА не выдаём как
  //    единственный источник правды о том, кто имеет право его видеть.
  const attachment = await attachmentsRepository.create({
    chat_id: chatId,
    uploader_id: uploaderId,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    storage_key: `chats/${chatId}/${safeFileName}`,
    url,
  });

  return attachment;
}
