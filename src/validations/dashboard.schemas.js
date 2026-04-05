const { z } = require('zod');

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.');

const summaryQuerySchema = z.object({
  endDate: dateStringSchema.optional(),
  startDate: dateStringSchema.optional(),
});

module.exports = {
  summaryQuerySchema,
};
