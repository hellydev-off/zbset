import * as chatsRepository from "./chats.repository.js";

export async function createNewChat(data) {
  try {
    const getChat = await chatsRepository.getChats(data.participant_ids);
    if (getChat.length > 0) {
      return getChat[0];
    } else {
      return await chatsRepository.createChat(data);
    }
  } catch (error) {
    console.error(error);
  }
}
