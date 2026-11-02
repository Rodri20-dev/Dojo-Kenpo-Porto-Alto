import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { requestContext } from './middleware/request-context.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { HttpError } from './utils/http-error.js';
import { createSupabaseClients } from './services/supabase.js';
import { createAdminAuth } from './middleware/admin-auth.js';
import { adminTestRouter } from './routes/admin-router.js';

export function createApp(config, { logger = console } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.logger = logger;

  const { authClient, adminClient } = createSupabaseClients(config);

  app.locals.supabase = {
    auth: authClient,
    admin: adminClient,
  };
  const requireAdmin = createAdminAuth({
    authClient,
    adminClient,
  });

  app.locals.requireAdmin = requireAdmin;

  app.use(helmet());
  app.use(requestContext);
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new HttpError(403, 'CORS_ORIGIN_DENIED', 'This origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: config.JSON_BODY_LIMIT, strict: true }));
  app.use('/api', rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: config.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests.' }, meta: { requestId: res.getHeader('X-Request-Id') } });
    },
  }));
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/admin-test', requireAdmin, adminTestRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

