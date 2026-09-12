// modules/users/users.router.js
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { sendMessageSchema } from "./message.schema.js";
import * as controller from "./messages.controller.js";

const router = Router();

// router.post("/", validate(createUserSchema), controller.createUser);
// router.get("/:id", validate(getUserSchema), controller.getUser);
router.post(
  "/sendMessage",
  validate(sendMessageSchema),
  controller.sendMessage,
);

export default router;
