// middlewares/upload.js
import multer from "multer";
import { UnsupportedFileTypeError } from "../shared/errors/index.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "audio/webm",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedFileTypeError(
          `Тип файла ${file.mimetype} не поддерживается`,
        ),
      );
    }
    cb(null, true);
  },
});
