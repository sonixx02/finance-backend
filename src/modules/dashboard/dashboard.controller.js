const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const dashboardService = require('./dashboard.service');

const getSummary = asyncHandler(async (req, res) => {
  const result = await dashboardService.getSummary(req.query);
  res.status(200).json(apiResponse.success(result, 'Dashboard summary fetched successfully.'));
});

module.exports = {
  getSummary,
};
