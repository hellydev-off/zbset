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

export async function getChats(req, res, next) {
  try {
    console.log(req.query.id);
    const getChats = await chatsService.getChats(req.query.id);

    res.status(201).json(getChats);
  } catch (error) {
    console.error(error);
  }
}

export async function changePinChat(req, res, next) {
  try {
    const { chatId, station } = req.body;
    const result = await chatsService.changePinChat(chatId, station);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
}

export async function deleteChatMessages(req, res, next) {
  try {
    const { chatId } = req.body;
    const io = req.app.get("io");

    const participantIds = await chatsService.getChatParticipantIds(
      req.body.chatId,
    );

    const result = await chatsService.deleteChatHistory(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "chat:delete_chat",
      result.deleteChatInfo,
      result.deleteChatInfo,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
}
