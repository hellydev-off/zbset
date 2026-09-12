import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
// import rateLimit from "express-rate-limit";

dotenv.config();

import { requestLogger } from "./middlewares/requestLogger.js";
// import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import chatsRouter from "./modules/chats/chats.router.js";
import messagesRouter from "./modules/messages/messages.router.js";

export function createApp() {
  const app = express();

  // --- security & базовые middleware ---
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- логирование запросов — ДО роутов ---
  app.use(requestLogger);

  // --- health check — до rate limit / основных роутов ---
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // --- роуты приложения ---
  app.use("/api/chat", chatsRouter);
  app.use("/api/message", messagesRouter);

  // --- 404 для несуществующих роутов — ПОСЛЕ роутов ---
  // app.use(notFoundHandler);

  // --- централизованный обработчик ошибок — СТРОГО ПОСЛЕДНИМ ---
  app.use(errorHandler);

  return app;
}
