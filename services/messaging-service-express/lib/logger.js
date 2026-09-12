import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = "dev";

export const logger = pino({
  level: "info",
  transport:
    NODE_ENV === "dev"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: ["req.headers.authorization", "req.body.password"],
});
