import * as chatsRepository from "./chats.repository.js";
import * as messageRepository from "../messages/messages.repository.js";

export async function createNewChat(data) {
  try {
    const getChat = await chatsRepository.checkChat(data.participant_ids);
    console.log(getChat);
    if (getChat.length > 0) {
      return getChat[0];
    } else {
      return await chatsRepository.createChat(data);
    }
  } catch (error) {
    console.error(error);
  }
}
export async function getChats(participant_id) {
  console.log("od", participant_id);
  try {
    return await chatsRepository.getChats(participant_id);
  } catch (error) {
    console.error(error);
  }
}

export async function getChatParticipantIds(chat_id) {
  try {
    return await chatsRepository.getChatParticipantIds(chat_id);
  } catch (error) {
    console.error(error);
  }
}

export async function updateLastMessage(chat_id, sender_id, text, content) {
  try {
    return await chatsRepository.updateLastMessage(
      chat_id,
      sender_id,
      text,
      content,
    );
  } catch (error) {
    console.error(error);
  }
}

export async function pinMessage(chat_id, messageId, sender_id, text, content) {
  try {
    return await chatsRepository.pinMessage(
      chat_id,
      messageId,
      sender_id,
      text,
      content,
    );
  } catch (error) {
    console.error(error);
  }
}

export async function unPinMessage(chat_id) {
  try {
    return await chatsRepository.unPinMessage(chat_id);
  } catch (error) {
    console.error(error);
  }
}

export async function deletePinAndChangeLastMessage(chat_id, messageId) {
  try {
    const chat = await chatsRepository.getChat(chat_id);
    console.log(chat);
    if ("sender_id" in chat.pin_message) {
      if (chat.pin_message.id === messageId) {
        await chatsRepository.unPinMessage(chat_id);
      }
    }

    const findMessage = await messageRepository.getChatMessagesByCount(
      chat_id,
      2,
    );

    return await chatsRepository.updateLastMessage(
      chat_id,
      messageId,
      findMessage[0].text,
      findMessage[0].content,
    );
  } catch (error) {
    console.error(error);
  }
}
