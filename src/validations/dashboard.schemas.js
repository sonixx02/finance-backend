const { z } = require('zod');

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.');

const summaryQuerySchema = z.object({
  endDate: dateStringSchema.optional(),
  startDate: dateStringSchema.optional(),
});

const categoryTotalsQuerySchema = z.object({
  endDate: dateStringSchema.optional(),
  recordTypeCode: z.string().trim().min(2).max(50).optional(),
  startDate: dateStringSchema.optional(),
});

const recentActivityQuerySchema = z.object({
  endDate: dateStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  startDate: dateStringSchema.optional(),
});

const trendsQuerySchema = z.object({
  endDate: dateStringSchema.optional(),
  granularity: z.enum(['week', 'month']).default('month'),
  startDate: dateStringSchema.optional(),
});

module.exports = {
  categoryTotalsQuerySchema,
  recentActivityQuerySchema,
  summaryQuerySchema,
  trendsQuerySchema,
};
