import { HttpError } from '../utils/http-error.js';

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}

export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code ?? (status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR');
  const message = status >= 500 ? 'An unexpected error occurred.' : status === 400 ? 'The request could not be processed.' : err.message;
  // Keep logs to a request identifier and classification; never log headers, bodies, or raw errors.
  const logger = req.app.locals.logger ?? console;
  if (status >= 500) logger.error(JSON.stringify({ requestId: req.requestId, method: req.method, status, code }));
  if (res.headersSent) return;
  res.status(status).json({ error: { code, message, ...(err.details ? { details: err.details } : {}) }, meta: { requestId: req.requestId } });
}
