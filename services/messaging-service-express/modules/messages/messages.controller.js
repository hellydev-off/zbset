import * as messagesService from "./messages.service.js";

export async function sendMessage(req, res, next) {
  try {
    console.log(req.validated.body);
    const result = await messagesService.sendMessage(req.validated.body);
    res.status(200).json(result);
  } catch (error) {
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
