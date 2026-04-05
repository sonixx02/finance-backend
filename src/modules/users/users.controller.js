const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const usersService = require('./users.service');

function buildActorContext(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? null,
    userId: req.auth.userId,
  };
}

const createUser = asyncHandler(async (req, res) => {
  const result = await usersService.createUser(req.body, buildActorContext(req));
  res.status(201).json(apiResponse.success(result, 'User created successfully.'));
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await usersService.listUsers(req.query);
  res.status(200).json(apiResponse.success(result.items, 'Users fetched successfully.', result.pagination));
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const result = await usersService.updateUserStatus(
    req.params.publicId,
    req.body,
    buildActorContext(req)
  );

  res.status(200).json(apiResponse.success(result, 'User status updated successfully.'));
});

const updateUserRoles = asyncHandler(async (req, res) => {
  const result = await usersService.updateUserRoles(
    req.params.publicId,
    req.body,
    buildActorContext(req)
  );

  res.status(200).json(apiResponse.success(result, 'User roles updated successfully.'));
});

module.exports = {
  createUser,
  listUsers,
  updateUserRoles,
  updateUserStatus,
};
