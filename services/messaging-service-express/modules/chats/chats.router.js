// modules/users/users.router.js
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createChatSchema } from "./chat.schema.js";
import * as controller from "./chats.controller.js";

const router = Router();

// router.post("/", validate(createUserSchema), controller.createUser);
// router.get("/:id", validate(getUserSchema), controller.getUser);
router.post("/create", validate(createChatSchema), controller.createChat);

export default router;
