import * as messageService from "../../modules/messages/messages.service.js";
import * as chatService from "../../modules/chats/chats.service.js";

export async function sendMessage({ chatId, text, socket, io }) {
  try {
    const participantIds = await chatService.getChatParticipantIds(chatId);
    const message = await messageService.sendMessage({
      chat_id: chatId,
      sender_id: socket.data.id,
      sender_type: socket.data.roles[0],
      text: text,
      content: {
        isContent: false,
      },
    });

    const updateChatLastMessage = await chatService.updateLastMessage(
      chatId,
      socket.data.id,
      text,
      socket.data.content,
    );

    const sender_id = participantIds.find((n) => n != socket.data.id);

    const changeManyViewed = await messageService.changeManyViewed(
      chatId,
      sender_id,
    );

    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:new",
      message,
      updateChatLastMessage,
      changeManyViewed,
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

export async function pinMessage({ chatId, messageId, socket, io }) {
  try {
    const findMessage = await messageService.findMessage(messageId);
    const updatePinMessage = await messageService.updatePinMessage(
      messageId,
      true,
    );
    const pinMessage = await chatService.pinMessage(
      chatId,
      messageId,
      socket.data.id,
      findMessage.text,
      findMessage.content,
    );

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:pin",
      pinMessage,
      updatePinMessage,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}

export async function unPinMessage({ chatId, messageId, socket, io }) {
  try {
    const unPinMessage = await chatService.unPinMessage(chatId);
    const updatePinMessage = await messageService.updatePinMessage(
      messageId,
      false,
    );

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:unpin",
      unPinMessage,
      updatePinMessage,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}

export async function deleteMessage({ chatId, messageId, socket, io }) {
  try {
    const deleteMessage = await messageService.deleteMessage(messageId);
    const deletePinAndChangeLastMessage =
      await chatService.deletePinAndChangeLastMessage(chatId, messageId);

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:delete",
      deleteMessage,
      deletePinAndChangeLastMessage,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}

export async function updateReaction({
  chatId,
  messageId,
  reaction,
  socket,
  io,
}) {
  try {
    const updateReaction = await messageService.updateReaction(
      messageId,
      reaction,
    );

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:add_reaction",
      updateReaction,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}

export async function changeViewed({ messageId, chatId, socket, io }) {
  try {
    const changeViewed = await messageService.changeViewed(messageId, chatId);

    const participantIds = await chatService.getChatParticipantIds(chatId);
    io.to(participantIds.map((id) => `user:${id}`)).emit(
      "message:is_viewed",
      changeViewed,
    );
  } catch (err) {
    socket.emit("error", {
      message: err.message,
      code: err.code || "INTERNAL",
    });
  }
}
