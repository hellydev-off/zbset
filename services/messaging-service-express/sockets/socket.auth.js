import jwt from "jsonwebtoken";

export function socketAuth(socket, next) {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization;

  if (!token) {
    return next(new Error("UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data = payload;

    next();
  } catch (err) {
    next(new Error("UNAUTHORIZED"));
  }
}
