import {
  classCreateSchema,
  classSessionCreateSchema,
} from '../schemas/request.js';

function validateMergedRecord(persisted, patch, schema, fields) {
  const merged = { ...persisted, ...patch };
  const candidate = Object.fromEntries(fields
    .filter((field) => Object.hasOwn(merged, field))
    .map((field) => [field, merged[field]]));
  return schema.safeParse(candidate);
}

const classFields = [
  'slug', 'title', 'description', 'targetAudience', 'location',
  'status', 'sortOrder', 'publishedAt', 'expiresAt',
];

const classSessionFields = [
  'classId', 'weekday', 'startTime', 'endTime', 'timezone',
  'location', 'status', 'validFrom', 'validUntil', 'sortOrder',
];

// Pure domain validation: callers supply the persisted record; no I/O occurs here.
export function validateClassPatchState(persisted, patch) {
  return validateMergedRecord(persisted, patch, classCreateSchema, classFields);
}

export function validateClassSessionPatchState(persisted, patch) {
  return validateMergedRecord(persisted, patch, classSessionCreateSchema, classSessionFields);
}
