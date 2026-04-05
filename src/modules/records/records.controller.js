const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const recordsService = require('./records.service');

function buildActorContext(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? null,
    userId: req.auth.userId,
  };
}

const getLookups = asyncHandler(async (req, res) => {
  void req;
  const result = await recordsService.getLookups();
  res.status(200).json(apiResponse.success(result, 'Record lookups fetched successfully.'));
});

const createRecord = asyncHandler(async (req, res) => {
  const result = await recordsService.createRecord(req.body, buildActorContext(req));
  res.status(201).json(apiResponse.success(result, 'Record created successfully.'));
});

const listRecords = asyncHandler(async (req, res) => {
  const result = await recordsService.listRecords(req.query);
  res.status(200).json(apiResponse.success(result.items, 'Records fetched successfully.', result.pagination));
});

const getRecord = asyncHandler(async (req, res) => {
  const result = await recordsService.getRecord(req.params.publicId);
  res.status(200).json(apiResponse.success(result, 'Record fetched successfully.'));
});

const updateRecord = asyncHandler(async (req, res) => {
  const result = await recordsService.updateRecord(
    req.params.publicId,
    req.body,
    buildActorContext(req)
  );

  res.status(200).json(apiResponse.success(result, 'Record updated successfully.'));
});

const deleteRecord = asyncHandler(async (req, res) => {
  const result = await recordsService.deleteRecord(req.params.publicId, buildActorContext(req));
  res.status(200).json(apiResponse.success(result, 'Record deleted successfully.'));
});

module.exports = {
  createRecord,
  deleteRecord,
  getLookups,
  getRecord,
  listRecords,
  updateRecord,
};
