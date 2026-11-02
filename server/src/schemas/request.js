import { z } from 'zod';

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('asc'),
};

function paginatedListSchema(sortFields) {
  return z.object({ ...pageFields, sort: z.enum(sortFields).optional() }).strict();
}

// API properties are camelCase; persistence uses the documented snake_case mapping.
export const publicationStatusSchema = z.enum(['draft', 'published', 'archived']);
export const contactStatusSchema = z.enum(['new', 'read', 'replied', 'archived']);
export const adminRoleSchema = z.enum(['owner', 'admin']);
export const mediaTypeSchema = z.enum(['image', 'video']);

export const classListQuerySchema = paginatedListSchema(['sortOrder', 'title', 'publishedAt']);
export const galleryListQuerySchema = paginatedListSchema(['sortOrder', 'title', 'publishedAt']);
export const mediaAssetListQuerySchema = paginatedListSchema(['sortOrder', 'title', 'publishedAt', 'createdAt']);
export const contactListQuerySchema = paginatedListSchema(['createdAt', 'status']);
export const paginationSchema = classListQuerySchema;

export const idParamSchema = z.object({ id: z.string().uuid() }).strict();

const nullableText = z.string().nullable().optional();
const nullableDateTime = z.iso.datetime({ offset: true }).nullable().optional();
const dateOnly = z.iso.date();
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?$/, 'Expected HH:mm:ss with optional fractional seconds.');

function timeValue(value) {
  const [hh, mm, rest] = value.split(':');
  const [ss, fraction = '0'] = rest.split('.');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(`0.${fraction}`);
}

function validTimezone(value) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function validateTimeRange(data, ctx, startKey = 'startTime', endKey = 'endTime') {
  const start = data[startKey];
  const end = data[endKey];
  if (typeof start === 'string' && typeof end === 'string' && timeOfDay.safeParse(start).success && timeOfDay.safeParse(end).success && timeValue(end) <= timeValue(start)) {
    ctx.addIssue({ code: 'custom', path: [endKey], message: 'End time must be later than start time.' });
  }
}

function validateDateRange(data, ctx, startKey = 'validFrom', endKey = 'validUntil') {
  const start = data[startKey];
  const end = data[endKey];
  if (start && end && end < start) {
    ctx.addIssue({ code: 'custom', path: [endKey], message: 'End date must not precede start date.' });
  }
}

function validatePublicationWindow(data, ctx) {
  const publishedAt = data.publishedAt;
  const expiresAt = data.expiresAt;
  if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt)) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be later than publication.' });
  }
}

const classFields = {
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: nullableText,
  targetAudience: nullableText,
  location: nullableText,
  status: publicationStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  publishedAt: nullableDateTime,
  expiresAt: nullableDateTime,
};

export const classCreateSchema = z.object({
  ...classFields,
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
}).strict().superRefine((data, ctx) => validatePublicationWindow(data, ctx));

export const classUpdateSchema = z.object(classFields).strict().partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
).superRefine((data, ctx) => validatePublicationWindow(data, ctx));

const classSessionFields = {
  weekday: z.number().int().min(1).max(7).optional(),
  startTime: timeOfDay.optional(),
  endTime: timeOfDay.optional(),
  timezone: z.string().trim().min(1).refine(validTimezone, 'Expected a valid IANA time-zone identifier.').optional(),
  location: nullableText,
  status: publicationStatusSchema.optional(),
  validFrom: dateOnly.nullable().optional(),
  validUntil: dateOnly.nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
};

export const classSessionCreateSchema = z.object({
  ...classSessionFields,
  classId: z.string().uuid(),
  weekday: z.number().int().min(1).max(7),
  startTime: timeOfDay,
  endTime: timeOfDay,
}).strict().superRefine((data, ctx) => {
  validateTimeRange(data, ctx);
  validateDateRange(data, ctx);
});

export const classSessionUpdateSchema = z.object(classSessionFields).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
).superRefine((data, ctx) => {
  validateTimeRange(data, ctx);
  validateDateRange(data, ctx);
});

const exceptionShared = {
  replacementLocation: nullableText,
  publicNote: nullableText,
};

export const scheduleExceptionCreateSchema = z.discriminatedUnion('exceptionType', [
  z.object({
    classSessionId: z.string().uuid(),
    exceptionDate: dateOnly,
    exceptionType: z.literal('cancelled'),
    replacementStartTime: z.null().optional(),
    replacementEndTime: z.null().optional(),
    ...exceptionShared,
  }).strict(),
  z.object({
    classSessionId: z.string().uuid(),
    exceptionDate: dateOnly,
    exceptionType: z.literal('modified'),
    replacementStartTime: timeOfDay,
    replacementEndTime: timeOfDay,
    ...exceptionShared,
  }).strict().superRefine((data, ctx) => validateTimeRange(data, ctx, 'replacementStartTime', 'replacementEndTime')),
]);

export const scheduleExceptionUpdateSchema = z.object({
  classSessionId: z.string().uuid().optional(),
  exceptionDate: dateOnly.optional(),
  exceptionType: z.enum(['cancelled', 'modified']).optional(),
  replacementStartTime: timeOfDay.nullable().optional(),
  replacementEndTime: timeOfDay.nullable().optional(),
  ...exceptionShared,
  status: publicationStatusSchema.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
).superRefine((data, ctx) => {
  if (data.exceptionType === 'cancelled' && (data.replacementStartTime != null || data.replacementEndTime != null)) {
    ctx.addIssue({ code: 'custom', path: ['exceptionType'], message: 'Cancelled exceptions cannot have replacement times.' });
  }
  if (data.exceptionType === 'modified') {
    if (!data.replacementStartTime || !data.replacementEndTime) {
      ctx.addIssue({ code: 'custom', path: ['replacementStartTime'], message: 'Modified exceptions require both replacement times in the update.' });
    } else validateTimeRange(data, ctx, 'replacementStartTime', 'replacementEndTime');
  }
  if ((data.replacementStartTime !== undefined || data.replacementEndTime !== undefined)
      && data.exceptionType !== 'cancelled' && data.exceptionType !== 'modified') {
    if (!data.replacementStartTime || !data.replacementEndTime) {
      ctx.addIssue({ code: 'custom', path: ['replacementEndTime'], message: 'Supply both replacement times together.' });
    } else validateTimeRange(data, ctx, 'replacementStartTime', 'replacementEndTime');
  }
});

export const mediaMimeTypeSchema = z.enum([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
]);
export const mediaAssetStatusSchema = publicationStatusSchema;
export const maxMediaBytes = 104_857_600;

export const adminProfileRecordSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().nullable(),
  avatarAssetId: z.string().uuid().nullable(),
  role: adminRoleSchema,
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}).strict();

export const mediaAssetRecordSchema = z.object({
  id: z.string().uuid(),
  bucketId: z.literal('dojo-media'),
  storagePath: z.string().min(1),
  mediaType: mediaTypeSchema,
  originalFilename: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  altText: z.string().nullable(),
  mimeType: mediaMimeTypeSchema,
  sizeBytes: z.number().int().min(0).max(maxMediaBytes),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationSeconds: z.number().min(0).nullable(),
  status: mediaAssetStatusSchema,
  sortOrder: z.number().int().min(0),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  uploadedBy: z.string().uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}).strict().superRefine((data, ctx) => {
  const isImageMime = data.mimeType.startsWith('image/');
  if ((data.mediaType === 'image') !== isImageMime) {
    ctx.addIssue({ code: 'custom', path: ['mimeType'], message: 'MIME type must match mediaType.' });
  }
});

export const mediaAssetUpdateSchema = z.object({
  title: nullableText,
  description: nullableText,
  altText: nullableText,
  status: mediaAssetStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  publishedAt: nullableDateTime,
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
);

export const siteConfigCreateSchema = z.object({
  configKey: z.string().min(1),
  configValue: z.json().optional(),
  isPublic: z.boolean().optional(),
}).strict();

export const siteConfigUpdateSchema = z.object({
  configValue: z.json().optional(),
  isPublic: z.boolean().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
);

// Public input intentionally excludes admin_notes, status, replied_at and generated timestamps.
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().min(3).max(320).email(),
  phone: z.string().trim().nullable().optional(),
  subject: z.string().trim().nullable().optional(),
  message: z.string().trim().min(1).max(10_000),
}).strict();

export const contactAdminUpdateSchema = z.object({
  status: contactStatusSchema.optional(),
  adminNotes: z.string().nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be supplied.' },
);


