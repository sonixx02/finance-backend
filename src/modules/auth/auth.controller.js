const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(apiResponse.success(result, 'Login successful.'));
});

module.exports = {
  login,
};
