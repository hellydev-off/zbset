import { Server } from "socket.io";
import * as messageService from "../modules/messages/messages.service.js";
import { socketAuth } from "./socket.auth.js";
import {
  deleteMessage,
  pinMessage,
  sendMessage,
  unPinMessage,
  updateMessage,
  updateReaction,
  changeViewed,
  addAnswerMessage,
} from "./operations/messages.js";

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.SOCKET_CORS_URL },
  });

  io.use((socket, next) => socketAuth(socket, next));

  io.on("connection", (socket) => {
    const userId = socket.data.id;
    socket.join(`user:${userId}`);

    socket.on("chat:open", ({ chatId }) => {
      socket.join(`chat:${chatId}`);
      console.log("new chat connect", chatId);
    });

    socket.on("chat:close", ({ chatId }) => {
      console.log("new chat dissconnect", chatId);
      socket.leave(`chat:${chatId}`);
    });

    socket.on("message:send", async ({ chatId, text }) => {
      await sendMessage({ chatId, text, socket, io });
    });

    socket.on("message:update", async ({ id, newMessage, chatId }) => {
      await updateMessage({ id, newMessage, chatId, socket, io });
    });

    socket.on("message:pin", async ({ chatId, messageId }) => {
      await pinMessage({ chatId, messageId, socket, io });
    });

    socket.on("message:unpin", async ({ chatId, messageId }) => {
      await unPinMessage({ chatId, messageId, socket, io });
    });

    socket.on("message:delete", async ({ chatId, messageId }) => {
      await deleteMessage({ chatId, messageId, socket, io });
    });

    socket.on(
      "message:add_reaction",
      async ({ chatId, messageId, reaction }) => {
        await updateReaction({ chatId, messageId, reaction, socket, io });
      },
    );

    socket.on("message:is_viewed", async ({ chatId, messageId }) => {
      await changeViewed({ chatId, messageId, socket, io });
    });

    socket.on(
      "message:add_answer",
      async ({
        chatId,
        messageAnswerId,
        sender_id,
        text,
        content,
        messageId,
      }) => {
        await addAnswerMessage({
          chatId,
          messageId,
          messageAnswerId,
          sender_id,
          text,
          content,
          socket,
          io,
        });
      },
    );

    socket.on("typing:start", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { userId });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:stop", { userId });
    });
  });

  return io;
}
