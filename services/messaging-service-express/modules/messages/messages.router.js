// modules/users/users.router.js
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { sendMessageSchema, chatIdShema } from "./message.schema.js";
import * as controller from "./messages.controller.js";

const router = Router();

// router.post("/", validate(createUserSchema), controller.createUser);
// router.get("/:id", validate(getUserSchema), controller.getUser);

router.post(
  "/sendMessage",
  validate(sendMessageSchema),
  controller.sendMessage,
);

router.get(
  "/getChatMessages",
  validate(chatIdShema),
  controller.getChatMessages,
);

export default router;
