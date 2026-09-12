import { ValidationError } from "../shared/errors/index.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new ValidationError("Ошибка валидации", details));
    }
    req.validated = result.data;
    next();
  };
}
