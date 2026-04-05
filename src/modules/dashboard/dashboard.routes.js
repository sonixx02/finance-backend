const express = require('express');

const authMiddleware = require('../../middleware/auth.middleware');
const requirePermission = require('../../middleware/requirePermission');
const validate = require('../../middleware/validate.middleware');
const { summaryQuerySchema } = require('../../validations/dashboard.schemas');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.use(authMiddleware, requirePermission('dashboard.read'));

router.get('/summary', validate(summaryQuerySchema, 'query'), dashboardController.getSummary);

module.exports = router;
