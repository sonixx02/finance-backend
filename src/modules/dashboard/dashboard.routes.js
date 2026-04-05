const express = require('express');

const authMiddleware = require('../../middleware/auth.middleware');
const requirePermission = require('../../middleware/requirePermission');
const validate = require('../../middleware/validate.middleware');
const {
  categoryTotalsQuerySchema,
  recentActivityQuerySchema,
  summaryQuerySchema,
  trendsQuerySchema,
} = require('../../validations/dashboard.schemas');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.use(authMiddleware, requirePermission('dashboard.read'));

router.get('/summary', validate(summaryQuerySchema, 'query'), dashboardController.getSummary);
router.get(
  '/category-totals',
  validate(categoryTotalsQuerySchema, 'query'),
  dashboardController.getCategoryTotals
);
router.get('/trends', validate(trendsQuerySchema, 'query'), dashboardController.getTrends);
router.get(
  '/recent-activity',
  validate(recentActivityQuerySchema, 'query'),
  dashboardController.getRecentActivity
);

module.exports = router;
