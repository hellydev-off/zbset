// modules/users/users.router.js
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createChatSchema } from "./chat.schema.js";
import * as controller from "./chats.controller.js";

const router = Router();

// router.post("/", validate(createUserSchema), controller.createUser);
router.get("/", controller.getChats);
router.post("/create", validate(createChatSchema), controller.createChat);
router.post("/changePin", controller.changePinChat);
router.post("/deleteChatHistory", controller.deleteChatMessages);

export default router;
