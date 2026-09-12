import * as messagesRepository from "./messages.repository.js";

export async function sendMessage(data) {
  try {
    return await messagesRepository.createMessage(data);
  } catch (error) {
    console.error(error);
  }
}
