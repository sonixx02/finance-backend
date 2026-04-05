const express = require('express');

const authMiddleware = require('../../middleware/auth.middleware');
const requirePermission = require('../../middleware/requirePermission');
const validate = require('../../middleware/validate.middleware');
const {
  createUserSchema,
  listUsersQuerySchema,
  updateUserRolesSchema,
  updateUserStatusSchema,
} = require('../../validations/user.schemas');
const usersController = require('./users.controller');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  requirePermission('users.manage'),
  validate(createUserSchema),
  usersController.createUser
);
router.get(
  '/',
  requirePermission('users.read'),
  validate(listUsersQuerySchema, 'query'),
  usersController.listUsers
);
router.patch(
  '/:publicId/status',
  requirePermission('users.manage'),
  validate(updateUserStatusSchema),
  usersController.updateUserStatus
);
router.patch(
  '/:publicId/roles',
  requirePermission('users.manage'),
  validate(updateUserRolesSchema),
  usersController.updateUserRoles
);

module.exports = router;
