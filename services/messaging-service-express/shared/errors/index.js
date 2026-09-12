import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
  constructor(message = "Ресурс не найден") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Невалидные данные", details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message = "Конфликт данных") {
    super(message, 409, "CONFLICT");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Требуется авторизация") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Доступ запрещён") {
    super(message, 403, "FORBIDDEN");
  }
}
