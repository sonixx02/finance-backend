const express = require('express');

const authMiddleware = require('../../middleware/auth.middleware');
const requirePermission = require('../../middleware/requirePermission');
const validate = require('../../middleware/validate.middleware');
const {
  createRecordSchema,
  listRecordsQuerySchema,
  updateRecordSchema,
} = require('../../validations/record.schemas');
const recordsController = require('./records.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/lookups', requirePermission('records.read'), recordsController.getLookups);
router.post(
  '/',
  requirePermission('records.create'),
  validate(createRecordSchema),
  recordsController.createRecord
);
router.get(
  '/',
  requirePermission('records.read'),
  validate(listRecordsQuerySchema, 'query'),
  recordsController.listRecords
);
router.get('/:publicId', requirePermission('records.read'), recordsController.getRecord);
router.patch(
  '/:publicId',
  requirePermission('records.update'),
  validate(updateRecordSchema),
  recordsController.updateRecord
);
router.delete('/:publicId', requirePermission('records.delete'), recordsController.deleteRecord);

module.exports = router;
