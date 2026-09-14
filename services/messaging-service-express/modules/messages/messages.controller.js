import * as messagesService from "./messages.service.js";
import * as chatService from "../chats/chats.service.js";

export async function sendMessage(req, res, next) {
  try {
    const participantIds = await chatService.getChatParticipantIds(
      req.body.chatId,
    );
    const io = req.app.get("io");
    const data = {
      user: req.user,
      ...req.body,
    };

    const result = await messagesService.sendMessage(data);

    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:new",
      result.message,
      result.updateChatLastMessage,
      result.changeManyViewed,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
    console.error(error);
  }
}

export async function getChatMessages(req, res, next) {
  try {
    const result = await messagesService.getChatMessages(
      req.validated.body.chat_id,
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
}
