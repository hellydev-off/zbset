import * as messageService from "../../modules/messages/messages.service.js";
import * as chatService from "../../modules/chats/chats.service.js";

export async function sendMessage({ chatId, text, socket, io }) {
  try {
    const message = await messageService.sendMessage({
      chat_id: chatId,
      sender_id: socket.data.id,
      sender_type: socket.data.roles[0],
      text: text,
      content: {
        isContent: false,
      },
    });

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:new",
      message,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}

export async function updateMessage({ id, newMessage, chatId, socket, io }) {
  try {
    const updateMessage = await messageService.updateMessage(id, newMessage);

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:update",
      updateMessage,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}
