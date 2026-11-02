import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { parseEnv, ConfigurationError } from '../src/config/env.js';
import {
  adminProfileRecordSchema,
  classCreateSchema,
  classListQuerySchema,
  classSessionCreateSchema,
  classSessionUpdateSchema,
  classUpdateSchema,
  contactAdminUpdateSchema,
  contactListQuerySchema,
  contactSchema,
  galleryListQuerySchema,
  mediaAssetRecordSchema,
  mediaAssetUpdateSchema,
  paginationSchema,
  scheduleExceptionCreateSchema,
  scheduleExceptionUpdateSchema,
  siteConfigCreateSchema,
  siteConfigUpdateSchema,
} from '../src/schemas/request.js';
import { createAdminAuth } from '../src/middleware/admin-auth.js';
import { validate } from '../src/middleware/validate.js';
import { validateClassPatchState, validateClassSessionPatchState } from '../src/domain/patch-validation.js';


const config = parseEnv({
  NODE_ENV: 'test',
  CORS_ORIGINS: 'http://localhost:5173',
  RATE_LIMIT_MAX: '2',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_SECRET_KEY: 'test-secret-key',
});


async function withServer(fn) {
  const server = createServer(createApp(config, { logger: { error() {} } }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test('health responds with JSON envelope, request id, and security headers', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/v1/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.data, { status: 'ok' });
    assert.equal(body.meta.requestId, response.headers.get('x-request-id'));
    assert.ok(response.headers.get('content-security-policy'));
    assert.equal(response.headers.get('x-powered-by'), null);
  });
});

test('CORS allows configured origins and rejects others', async () => {
  await withServer(async (base) => {
    const allowed = await fetch(`${base}/api/v1/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const denied = await fetch(`${base}/api/v1/health`, { headers: { Origin: 'https://untrusted.example' } });
    assert.equal(denied.status, 403);
    assert.equal((await denied.json()).error.code, 'CORS_ORIGIN_DENIED');
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  });
});

test('unknown paths and invalid JSON return normalized errors', async () => {
  await withServer(async (base) => {
    const missing = await fetch(`${base}/api/v1/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
    const malformed = await fetch(`${base}/api/v1/health`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).meta.requestId, malformed.headers.get('x-request-id'));
  });
});

test('API rate limit returns a JSON 429 response', async () => {
  await withServer(async (base) => {
    await fetch(`${base}/api/v1/health`);
    await fetch(`${base}/api/v1/health`);
    const limited = await fetch(`${base}/api/v1/health`);
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).error.code, 'RATE_LIMITED');
  });
});

test('environment validation rejects wildcard CORS and missing Supabase configuration', () => {
  assert.throws(() => parseEnv({
    NODE_ENV: 'development',
    CORS_ORIGINS: '*',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'test-key',
    SUPABASE_SECRET_KEY: 'test-secret',
  }), ConfigurationError);

  assert.throws(() => parseEnv({
    NODE_ENV: 'development',
    CORS_ORIGINS: 'http://localhost:5173',
  }), ConfigurationError);
});

test('request schemas bound pagination, allowlist sorting per resource, and validate contact payloads', () => {
  assert.equal(paginationSchema.safeParse({ page: '1', pageSize: '100' }).success, true);
  assert.equal(paginationSchema.safeParse({ page: '0' }).success, false);
  assert.equal(classListQuerySchema.safeParse({ sort: 'title' }).success, true);
  assert.equal(galleryListQuerySchema.safeParse({ sort: 'publishedAt' }).success, true);
  assert.equal(contactListQuerySchema.safeParse({ sort: 'createdAt' }).success, true);
  assert.equal(contactListQuerySchema.safeParse({ sort: 'id;drop table' }).success, false);
  assert.equal(contactSchema.safeParse({ name: ' A ', email: 'a@example.com', phone: '+351 000', subject: null, message: ' X ' }).success, true);
  assert.equal(contactSchema.safeParse({ name: 'A', email: 'not-an-email', message: 'X' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'A', email: 'a@example.com', message: 'X', status: 'replied' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'A'.repeat(151), email: 'a@example.com', message: 'X' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'A', email: 'a@example.com', message: 'X'.repeat(10_001) }).success, false);
  assert.equal(contactAdminUpdateSchema.safeParse({ status: 'archived', adminNotes: 'Internal' }).success, true);
  assert.equal(contactAdminUpdateSchema.safeParse({ status: 'closed' }).success, false);
});

test('class schemas require a caller-supplied slug and enforce publication window rules', () => {
  const valid = { slug: 'adult-kenpo', title: 'Adult Kenpo', status: 'draft', sortOrder: 0 };
  assert.equal(classCreateSchema.safeParse(valid).success, true);
  assert.equal(classCreateSchema.safeParse({ title: 'No slug' }).success, false);
  assert.equal(classCreateSchema.safeParse({ ...valid, expiresAt: '2026-05-01T00:00:00Z', publishedAt: '2026-05-01T00:00:00Z' }).success, false);
  assert.equal(classCreateSchema.safeParse({ ...valid, status: 'active' }).success, false);
  assert.equal(classUpdateSchema.safeParse({ targetAudience: 'Adults', location: null }).success, true);
  assert.equal(classUpdateSchema.safeParse({}).success, false);
  assert.equal(classUpdateSchema.safeParse({ publishedAt: '2026-06-01T00:00:00Z', expiresAt: '2026-05-01T00:00:00Z' }).success, false);
});

test('class session schemas validate ISO weekday, PostgreSQL time format, IANA zone, and date/time ranges', () => {
  const valid = { classId: testAdminId, weekday: 1, startTime: '18:30:00', endTime: '19:45:00', timezone: 'Europe/Lisbon', validFrom: '2026-01-01', validUntil: '2026-12-31' };
  assert.equal(classSessionCreateSchema.safeParse(valid).success, true);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, weekday: 0 }).success, false);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, timezone: 'Mars/Olympus' }).success, false);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, startTime: '19:45:00', endTime: '18:30:00' }).success, false);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, validFrom: '2026-12-31', validUntil: '2026-01-01' }).success, false);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, startTime: '18:30' }).success, false);
  assert.equal(classSessionCreateSchema.safeParse({ ...valid, startTime: '24:00:00' }).success, false);
  assert.equal(classSessionUpdateSchema.safeParse({ sortOrder: 2 }).success, true);
  assert.equal(classSessionUpdateSchema.safeParse({}).success, false);
});

test('partial PATCH validation checks the merged persisted class state', () => {
  const patch = { expiresAt: '2026-05-01T00:00:00Z' };
  const persisted = {
    slug: 'adult-kenpo', title: 'Adult Kenpo', status: 'published',
    publishedAt: '2026-06-01T00:00:00Z', expiresAt: null,
  };

  // A PATCH schema only sees supplied fields; it cannot validate against the stored value.
  assert.equal(classUpdateSchema.safeParse(patch).success, true);
  assert.equal(validateClassPatchState(persisted, patch).success, false);
  assert.equal(validateClassPatchState(persisted, { expiresAt: '2026-07-01T00:00:00Z' }).success, true);
});

test('partial PATCH validation checks the merged persisted session state', () => {
  const persisted = {
    classId: testAdminId, weekday: 1, startTime: '18:30:00', endTime: '19:45:00',
    timezone: 'Europe/Lisbon', validFrom: '2026-01-01', validUntil: '2026-12-31',
  };
  const patch = { endTime: '18:00:00' };

  assert.equal(classSessionUpdateSchema.safeParse(patch).success, true);
  assert.equal(validateClassSessionPatchState(persisted, patch).success, false);
  assert.equal(validateClassSessionPatchState(persisted, { endTime: '20:00:00' }).success, true);
});

test('schedule exception schemas enforce mandatory session ownership and conditional replacement times', () => {
  const base = { classSessionId: testAdminId, exceptionDate: '2026-12-25' };
  assert.equal(scheduleExceptionCreateSchema.safeParse({ ...base, exceptionType: 'cancelled' }).success, true);
  assert.equal(scheduleExceptionCreateSchema.safeParse({ ...base, exceptionType: 'cancelled', replacementStartTime: null, replacementEndTime: null }).success, true);
  assert.equal(scheduleExceptionCreateSchema.safeParse({ ...base, exceptionType: 'cancelled', replacementStartTime: '10:00:00' }).success, false);
  assert.equal(scheduleExceptionCreateSchema.safeParse({ ...base, exceptionType: 'modified', replacementStartTime: '10:00:00', replacementEndTime: '11:00:00' }).success, true);
  assert.equal(scheduleExceptionCreateSchema.safeParse({ ...base, exceptionType: 'modified', replacementStartTime: '11:00:00', replacementEndTime: '10:00:00' }).success, false);
  assert.equal(scheduleExceptionCreateSchema.safeParse({ exceptionDate: '2026-12-25', exceptionType: 'cancelled' }).success, false);
  assert.equal(scheduleExceptionUpdateSchema.safeParse({ exceptionType: 'modified', replacementStartTime: '10:00:00', replacementEndTime: '11:00:00' }).success, true);
  assert.equal(scheduleExceptionUpdateSchema.safeParse({ exceptionType: 'modified' }).success, false);
});

test('media schemas match the configured public bucket MIME list, editorial states, and 100 MiB limit', () => {
  const asset = {
    id: testAdminId, bucketId: 'dojo-media', storagePath: 'generated/key.jpg', mediaType: 'image',
    originalFilename: 'dojo.jpg', title: null, description: null, altText: 'Treino', mimeType: 'image/jpeg',
    sizeBytes: 104_857_600, width: 1280, height: 720, durationSeconds: null, status: 'draft', sortOrder: 0,
    publishedAt: null, uploadedBy: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  };
  assert.equal(mediaAssetRecordSchema.safeParse(asset).success, true);
  assert.equal(mediaAssetRecordSchema.safeParse({ ...asset, sizeBytes: 104_857_601 }).success, false);
  assert.equal(mediaAssetRecordSchema.safeParse({ ...asset, mimeType: 'image/avif' }).success, false);
  assert.equal(mediaAssetRecordSchema.safeParse({ ...asset, mediaType: 'video', mimeType: 'image/jpeg' }).success, false);
  assert.equal(mediaAssetUpdateSchema.safeParse({ title: 'New title', status: 'published' }).success, true);
  assert.equal(mediaAssetUpdateSchema.safeParse({ status: 'ready' }).success, false);
  assert.equal(mediaAssetUpdateSchema.safeParse({}).success, false);
});

test('site config schemas use key/value records and admin profile records use the actual role fields', () => {
  assert.equal(siteConfigCreateSchema.safeParse({ configKey: 'homepage', configValue: { title: 'Site' }, isPublic: true }).success, true);
  assert.equal(siteConfigCreateSchema.safeParse({ configKey: 'homepage', updatedBy: testAdminId }).success, false);
  assert.equal(siteConfigUpdateSchema.safeParse({ configValue: ['value'], isPublic: false }).success, true);
  assert.equal(siteConfigUpdateSchema.safeParse({}).success, false);
  assert.equal(adminProfileRecordSchema.safeParse({ userId: testAdminId, displayName: null, avatarAssetId: null, role: 'owner', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }).success, true);
  assert.equal(adminProfileRecordSchema.safeParse({ userId: testAdminId, displayName: null, avatarAssetId: null, role: 'superadmin', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }).success, false);
});

const testAdminId = '11111111-1111-4111-8111-111111111111';

function createMockSupabase({
  user = { id: testAdminId },
  authError = null,
  profile = {
    user_id: testAdminId,
    role: 'owner',
    is_active: true,
  },
  profileError = null,
} = {}) {
  const authClient = {
    auth: {
      getUser: async (token) => ({
        data: { user: token === 'valid-token' ? user : null },
        error: token === 'valid-token' ? authError : new Error('Invalid token'),
      }),
    },
  };

  const adminClient = {
    from: (table) => {
      assert.equal(table, 'admin_profiles');

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: profile,
              error: profileError,
            }),
          }),
        }),
      };
    },
  };

  return { authClient, adminClient };
}

async function invokeAdminAuth(clients, token = 'valid-token') {
  const middleware = createAdminAuth(clients);
  const req = {
    get: () => token ? `Bearer ${token}` : undefined,
  };

  const error = await new Promise((resolve) => {
    middleware(req, {}, (value) => resolve(value));
  });

  return { req, error };
}

test('admin authentication accepts active owner and admin profiles', async () => {
  for (const role of ['owner', 'admin']) {
    const clients = createMockSupabase({
      profile: {
        user_id: testAdminId,
        role,
        is_active: true,
      },
    });

    const result = await invokeAdminAuth(clients);

    assert.equal(result.error, undefined);
    assert.deepEqual(result.req.auth, {
      userId: testAdminId,
      role,
    });
  }
});

test('admin authentication rejects missing or invalid tokens', async () => {
  const clients = createMockSupabase();

  const missing = await invokeAdminAuth(clients, '');
  assert.equal(missing.error.status, 401);

  const invalid = await invokeAdminAuth(clients, 'invalid-token');
  assert.equal(invalid.error.status, 401);
});

test('admin authentication rejects missing, inactive, or unauthorized profiles', async () => {
  const cases = [
    { profile: null },
    {
      profile: {
        user_id: testAdminId,
        role: 'owner',
        is_active: false,
      },
    },
    {
      profile: {
        user_id: testAdminId,
        role: 'member',
        is_active: true,
      },
    },
  ];

  for (const options of cases) {
    const result = await invokeAdminAuth(createMockSupabase(options));
    assert.equal(result.error.status, 403);
    assert.equal(result.error.code, 'FORBIDDEN');
  }
});

test('admin authentication returns 503 when profile verification fails', async () => {
  const clients = createMockSupabase({
    profileError: new Error('Database unavailable'),
  });

  const result = await invokeAdminAuth(clients);

  assert.equal(result.error.status, 503);
  assert.equal(result.error.code, 'AUTH_SERVICE_UNAVAILABLE');
});

test('admin authentication fails closed when Supabase clients are missing', async () => {
  const middleware = createAdminAuth({});
  const result = await new Promise((resolve) => {
    middleware({}, {}, (error) => resolve(error));
  });

  assert.equal(result.status, 503);
  assert.equal(result.code, 'AUTH_NOT_CONFIGURED');
});

test('request validation middleware returns a structured validation error', async () => {
  const middleware = validate(contactSchema);
  const error = await new Promise((resolve) => middleware({ body: { name: 'X' } }, {}, resolve));
  assert.equal(error.status, 400);
  assert.equal(error.code, 'VALIDATION_ERROR');
  assert.ok(error.details.some((issue) => issue.path === 'email'));
});
