import { Server } from "socket.io";
import * as messageService from "../modules/messages/messages.service.js";
import { socketAuth } from "./socket.auth.js";
import { sendMessage, updateMessage } from "./operations/messages.js";

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

    socket.on("typing:start", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { userId });
    });
  });

  return io;
}
