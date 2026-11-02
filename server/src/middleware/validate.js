import { HttpError } from '../utils/http-error.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Request validation failed.', details));
    }
    req.validated ??= {};
    req.validated[source] = parsed.data;
    next();
  };
}
