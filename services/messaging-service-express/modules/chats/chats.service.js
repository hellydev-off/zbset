import * as chatsRepository from "./chats.repository.js";

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
