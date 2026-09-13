import { io } from "socket.io-client";
import { auth } from "./store/auth";

// Общее (singleton) соединение для основного приложения — отдельно от
// страницы /sockets, у которой свой изолированный тестовый инстанс.
let socket = null;

function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
    auth: { token: auth.token },
    autoConnect: false,
  });
}

export function getSocket() {
  if (!socket) socket = createSocket();
  return socket;
}

// Сервер проверяет подпись токена (jwt.verify), поэтому если auth.token
// поменялся (перелогин), старое соединение с зашитым токеном пересоздаём.
export function ensureConnected() {
  if (socket && socket.auth.token !== auth.token) {
    socket.disconnect();
    socket = null;
  }
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}
