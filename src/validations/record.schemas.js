const { z } = require('zod');

const booleanishSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  return Boolean(value);
}, z.boolean());

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.');

const createRecordSchema = z.object({
  amount: z.coerce.number().positive(),
  categoryPublicId: z.string().uuid(),
  currencyCode: z.string().trim().length(3).default('INR'),
  notes: z.string().trim().max(2000).optional(),
  occurredOn: dateStringSchema,
  recordTypeCode: z.string().trim().min(2).max(50),
});

const updateRecordSchema = createRecordSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

const listRecordsQuerySchema = z.object({
  categoryPublicId: z.string().uuid().optional(),
  createdByPublicId: z.string().uuid().optional(),
  endDate: dateStringSchema.optional(),
  includeDeleted: booleanishSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  recordTypeCode: z.string().trim().min(2).max(50).optional(),
  startDate: dateStringSchema.optional(),
});

module.exports = {
  createRecordSchema,
  listRecordsQuerySchema,
  updateRecordSchema,
};
