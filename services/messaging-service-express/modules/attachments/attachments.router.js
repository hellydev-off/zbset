import { Router } from "express";
import { upload } from "../../middlewares/upload.js";
import * as controller from "./attachments.controller.js";

const router = Router();

router.post(
  "/:chatId/attachments",
  upload.single("file"),
  controller.uploadAttachment,
);

export default router;
