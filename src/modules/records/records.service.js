const { withTransaction } = require('../../config/db');
const ApiError = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');
const iamService = require('../iam/iam.service');
const recordsRepository = require('./records.repository');

function formatRecord(row) {
  return {
    amount: row.amount,
    category: {
      name: row.category_name,
      publicId: row.category_public_id,
      slug: row.category_slug,
    },
    createdAt: row.created_at,
    createdBy: {
      fullName: row.created_by_name,
      publicId: row.created_by_public_id,
    },
    currencyCode: row.currency_code,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by_public_id
      ? {
          fullName: row.deleted_by_name,
          publicId: row.deleted_by_public_id,
        }
      : null,
    notes: row.notes,
    occurredOn: row.occurred_on,
    publicId: row.public_id,
    recordType: {
      balanceEffect: row.balance_effect,
      code: row.record_type_code,
      name: row.record_type_name,
    },
    updatedAt: row.updated_at,
    updatedBy: row.updated_by_public_id
      ? {
          fullName: row.updated_by_name,
          publicId: row.updated_by_public_id,
        }
      : null,
  };
}

async function createRecord(payload, actor) {
  return withTransaction(async (client) => {
    const recordContext = await recordsRepository.findTypeAndCategory(
      payload.recordTypeCode,
      payload.categoryPublicId,
      client
    );

    if (!recordContext) {
      throw ApiError.badRequest('Record type and category combination is invalid or inactive.');
    }

    const createdRecord = await recordsRepository.createRecord(
      {
        amount: payload.amount,
        categoryId: recordContext.category_id,
        createdBy: actor.userId,
        currencyCode: payload.currencyCode.toUpperCase(),
        notes: payload.notes,
        occurredOn: payload.occurredOn,
        recordTypeId: recordContext.record_type_id,
      },
      client
    );

    await iamService.writeAuditLog(
      {
        action: 'create',
        actorUserId: actor.userId,
        entityId: createdRecord.id,
        entityName: 'financial_records',
        ipAddress: actor.ipAddress,
        newValues: formatRecord(createdRecord),
        oldValues: null,
        userAgent: actor.userAgent,
      },
      client
    );

    return formatRecord(createdRecord);
  });
}

async function getLookups() {
  const result = await recordsRepository.listLookups();

  return {
    categories: result.categories.map((row) => ({
      name: row.category_name,
      publicId: row.category_public_id,
      recordType: {
        balanceEffect: row.balance_effect,
        code: row.record_type_code,
        name: row.record_type_name,
      },
      slug: row.category_slug,
    })),
    recordTypes: result.recordTypes.map((row) => ({
      balanceEffect: row.balance_effect,
      code: row.code,
      name: row.name,
    })),
  };
}

async function listRecords(filters) {
  const pagination = getPagination(filters, { defaultLimit: 20, maxLimit: 100 });
  const result = await recordsRepository.listRecords(filters, pagination);

  return {
    items: result.rows.map(formatRecord),
    pagination: {
      limit: pagination.limit,
      page: pagination.page,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / pagination.limit)),
    },
  };
}

async function getRecord(publicId, options = {}) {
  const row = await recordsRepository.findRecordByPublicId(publicId, null, options);

  if (!row) {
    throw ApiError.notFound('Financial record not found.');
  }

  return formatRecord(row);
}

async function updateRecord(publicId, payload, actor) {
  return withTransaction(async (client) => {
    const existingRecord = await recordsRepository.findRecordByPublicId(publicId, client, {
      includeDeleted: true,
    });

    if (!existingRecord) {
      throw ApiError.notFound('Financial record not found.');
    }

    if (existingRecord.deleted_at) {
      throw ApiError.badRequest('Deleted records cannot be updated.');
    }

    const nextRecordTypeCode = payload.recordTypeCode ?? existingRecord.record_type_code;
    const nextCategoryPublicId = payload.categoryPublicId ?? existingRecord.category_public_id;
    const recordContext = await recordsRepository.findTypeAndCategory(
      nextRecordTypeCode,
      nextCategoryPublicId,
      client
    );

    if (!recordContext) {
      throw ApiError.badRequest('Record type and category combination is invalid or inactive.');
    }

    const updatedRecord = await recordsRepository.updateRecord(
      publicId,
      {
        amount: payload.amount,
        categoryId: recordContext.category_id,
        currencyCode:
          payload.currencyCode !== undefined ? payload.currencyCode.toUpperCase() : undefined,
        notes: Object.prototype.hasOwnProperty.call(payload, 'notes') ? payload.notes ?? null : undefined,
        occurredOn: payload.occurredOn,
        recordTypeId: recordContext.record_type_id,
        updatedBy: actor.userId,
      },
      client
    );

    await iamService.writeAuditLog(
      {
        action: 'update',
        actorUserId: actor.userId,
        entityId: existingRecord.id,
        entityName: 'financial_records',
        ipAddress: actor.ipAddress,
        newValues: formatRecord(updatedRecord),
        oldValues: formatRecord(existingRecord),
        userAgent: actor.userAgent,
      },
      client
    );

    return formatRecord(updatedRecord);
  });
}

async function deleteRecord(publicId, actor) {
  return withTransaction(async (client) => {
    const existingRecord = await recordsRepository.findRecordByPublicId(publicId, client, {
      includeDeleted: true,
    });

    if (!existingRecord) {
      throw ApiError.notFound('Financial record not found.');
    }

    if (existingRecord.deleted_at) {
      throw ApiError.badRequest('Financial record has already been deleted.');
    }

    const deletedRecord = await recordsRepository.softDeleteRecord(publicId, actor.userId, client);

    await iamService.writeAuditLog(
      {
        action: 'delete',
        actorUserId: actor.userId,
        entityId: existingRecord.id,
        entityName: 'financial_records',
        ipAddress: actor.ipAddress,
        newValues: formatRecord(deletedRecord),
        oldValues: formatRecord(existingRecord),
        userAgent: actor.userAgent,
      },
      client
    );

    return formatRecord(deletedRecord);
  });
}

module.exports = {
  createRecord,
  deleteRecord,
  getLookups,
  getRecord,
  listRecords,
  updateRecord,
};
