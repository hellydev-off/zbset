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
