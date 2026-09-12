import { AppError } from "../shared/errors/AppError.js";

export function errorHandler(err, req, res, next) {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  const log = req.log || console;

  if (isOperational) {
    log.warn({ err, code: err.code }, err.message);
  } else {
    log.error({ err }, "Unhandled error");
  }

  res.status(statusCode).json({
    error: {
      message: isOperational ? err.message : "Внутренняя ошибка сервера",
      code: isOperational ? err.code : "INTERNAL_ERROR",
      ...(isOperational && err.details ? { details: err.details } : {}),
      ...(process.env.NODE_ENV === "dev" ? { stack: err.stack } : {}),
    },
  });
}
