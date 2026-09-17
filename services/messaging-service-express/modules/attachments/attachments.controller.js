import * as attachmentsService from "./attachments.service.js";

export async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: { message: "Файл не передан", code: "NO_FILE" } });
    }

    const attachment = await attachmentsService.saveAttachment({
      chatId: Number(req.params.chatId),
      uploaderId: req.user.id, // из auth-middleware
      file: req.file, // { buffer, originalname, mimetype, size }
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
}
