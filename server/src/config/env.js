
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(60),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  JSON_BODY_LIMIT: z.string().default('10kb'),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'test') {
    for (const key of [
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SECRET_KEY',
    ]) {
      if (!data[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required outside test environment`,
        });
      }
    }
  }
});

export class ConfigurationError extends Error {
  constructor(issues) {
    super('Invalid server configuration');
    this.name = 'ConfigurationError';
    this.issues = issues;
  }
}

export function parseEnv(source = process.env) {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new ConfigurationError(result.error.issues);
  }

  const origins = result.data.CORS_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    throw new ConfigurationError([
      {
        path: ['CORS_ORIGINS'],
        message: 'Wildcard origins are not allowed',
      },
    ]);
  }

  return {
    ...result.data,
    corsOrigins: origins,
  };
}
