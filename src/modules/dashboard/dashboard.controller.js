const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const dashboardService = require('./dashboard.service');

const getSummary = asyncHandler(async (req, res) => {
  const result = await dashboardService.getSummary(req.query);
  res.status(200).json(apiResponse.success(result, 'Dashboard summary fetched successfully.'));
});

const getCategoryTotals = asyncHandler(async (req, res) => {
  const result = await dashboardService.getCategoryTotals(req.query);
  res.status(200).json(apiResponse.success(result, 'Category totals fetched successfully.'));
});

const getTrends = asyncHandler(async (req, res) => {
  const result = await dashboardService.getTrends(req.query);
  res.status(200).json(apiResponse.success(result, 'Trend data fetched successfully.'));
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const result = await dashboardService.getRecentActivity(req.query);
  res.status(200).json(apiResponse.success(result, 'Recent activity fetched successfully.'));
});

module.exports = {
  getCategoryTotals,
  getRecentActivity,
  getSummary,
  getTrends,
};
