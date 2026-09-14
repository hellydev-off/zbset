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

export async function findMessage(id) {
  try {
    return await messagesRepository.findMessage(id);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteMessage(id) {
  try {
    return messagesRepository.deleteMessage(id);
  } catch (error) {
    console.error(error);
  }
}

export async function updateReaction(id, reaction) {
  try {
    return messagesRepository.updateRaction(id, reaction);
  } catch (error) {
    console.error(error);
  }
}

export async function changeManyViewed(chat_id, sender_id) {
  try {
    return await messagesRepository.changeManyViewed(chat_id, sender_id);
  } catch (error) {
    console.log(error);
  }
}

export async function changeViewed(messageId, chat_id, sender_id) {
  try {
    // const changeManyViewed = await messagesRepository.changeManyViewed(
    //   chat_id,
    //   sender_id,
    // );
    return await messagesRepository.changeViewed(messageId);
  } catch (error) {
    console.error(error);
  }
}

export async function updatePinMessage(id, station) {
  try {
    return messagesRepository.updatePinMessage(id, station);
  } catch (error) {
    console.error(error);
  }
}
