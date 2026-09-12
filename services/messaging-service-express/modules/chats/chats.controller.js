import * as chatsService from "./chats.service.js";

export async function createChat(req, res, next) {
  try {
    console.log(req.validated.body);
    const generateChat = await chatsService.createNewChat(req.validated.body);

    res.status(201).json(generateChat);
  } catch (error) {
    console.error(error);
  }
}
