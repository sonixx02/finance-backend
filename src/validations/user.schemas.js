const { z } = require('zod');

const roleCodeSchema = z.string().trim().min(2).max(50);
const statusCodeSchema = z.string().trim().min(2).max(50);

const createUserSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(150),
  password: z.string().min(8).max(72),
  roleCodes: z.array(roleCodeSchema).min(1),
  statusCode: statusCodeSchema,
});

const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  roleCode: roleCodeSchema.optional(),
  search: z.string().trim().min(1).max(255).optional(),
  statusCode: statusCodeSchema.optional(),
});

const updateUserStatusSchema = z.object({
  statusCode: statusCodeSchema,
});

const updateUserRolesSchema = z.object({
  roleCodes: z.array(roleCodeSchema).min(1),
});

module.exports = {
  createUserSchema,
  listUsersQuerySchema,
  updateUserRolesSchema,
  updateUserStatusSchema,
};
