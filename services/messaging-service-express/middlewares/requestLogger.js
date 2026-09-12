import { randomUUID } from "crypto";
import { logger } from "../lib/logger.js";

export function requestLogger(req, res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  req.log = logger.child({ requestId: req.id });

  const start = Date.now();

  res.on("finish", () => {
    req.log.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      "request completed",
    );
  });

  next();
}
