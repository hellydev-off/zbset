import * as messagesRepository from "./messages.repository.js";
import * as chatService from "../chats/chats.service.js";

export async function sendMessage(data) {
  try {
    const saveMessage = await messagesRepository.createMessage({
      chat_id: data.chatId,
      sender_id: data.user.id,
      sender_type: data.user.roles[0],
      text: data.text,
      content: data.content,
    });

    const updateChatLastMessage = await chatService.updateLastMessage(
      data.chatId,
      data.user.id,
      data.text,
      data.content,
    );

    const changeManyViewed = await messagesRepository.changeManyViewed(
      data.chatId,
      data.user.id,
    );

    return {
      message: saveMessage,
      updateChatLastMessage: updateChatLastMessage,
      changeManyViewed: changeManyViewed,
    };
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

export async function addAnswerMessage(
  messageId,
  messageAnswerId,
  sender_id,
  text,
  content,
) {
  try {
    return await messagesRepository.addAnswerMessage(
      messageId,
      messageAnswerId,
      sender_id,
      text,
      content,
    );
  } catch (error) {
    console.error(error);
  }
}

export async function deleteMessages(chatId) {
  try {
    return messagesRepository.deleteMessages(chatId);
  } catch (error) {
    console.error(error);
  }
}
