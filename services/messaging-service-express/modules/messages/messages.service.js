import * as messagesRepository from "./messages.repository.js";

export async function sendMessage(data) {
  try {
    return await messagesRepository.createMessage(data);
  } catch (error) {
    console.error(error);
  }
}

export async function getChatMessages(chat_id) {
  try {
    return await messagesRepository.getChatMessages(chat_id);
  } catch (error) {
    console.error(error);
  }
}

export async function updateMessage(id, newMessage) {
  try {
    return await messagesRepository.updateMessage(id, newMessage);
  } catch (error) {
    console.error(error);
  }
}
