const { query } = require('../../config/db');

function runQuery(client, text, params = []) {
  return client ? client.query(text, params) : query(text, params);
}

const recordSelectFrom = `
  SELECT
    fr.id,
    fr.public_id,
    fr.amount::text AS amount,
    fr.currency_code,
    fr.occurred_on,
    fr.notes,
    fr.created_at,
    fr.updated_at,
    fr.deleted_at,
    rt.code AS record_type_code,
    rt.name AS record_type_name,
    rt.balance_effect,
    c.public_id AS category_public_id,
    c.name AS category_name,
    c.slug AS category_slug,
    creator.public_id AS created_by_public_id,
    creator.full_name AS created_by_name,
    updater.public_id AS updated_by_public_id,
    updater.full_name AS updated_by_name,
    deleter.public_id AS deleted_by_public_id,
    deleter.full_name AS deleted_by_name
  FROM financial_records fr
  JOIN record_types rt ON rt.id = fr.record_type_id
  JOIN categories c ON c.id = fr.category_id
  JOIN users creator ON creator.id = fr.created_by
  LEFT JOIN users updater ON updater.id = fr.updated_by
  LEFT JOIN users deleter ON deleter.id = fr.deleted_by
`;

function buildRecordFilters(filters, options = {}) {
  const includeDeleted = options.includeDeleted ?? false;
  const params = [];
  const conditions = [];

  if (!includeDeleted) {
    conditions.push('fr.deleted_at IS NULL');
  }

  if (filters.recordTypeCode) {
    params.push(filters.recordTypeCode.toLowerCase());
    conditions.push(`rt.code = $${params.length}`);
  }

  if (filters.categoryPublicId) {
    params.push(filters.categoryPublicId);
    conditions.push(`c.public_id = $${params.length}`);
  }

  if (filters.createdByPublicId) {
    params.push(filters.createdByPublicId);
    conditions.push(`creator.public_id = $${params.length}`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`fr.occurred_on >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`fr.occurred_on <= $${params.length}`);
  }

  return {
    params,
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
  };
}

async function findTypeAndCategory(recordTypeCode, categoryPublicId, client) {
  const sql = `
    SELECT
      rt.id AS record_type_id,
      rt.code AS record_type_code,
      rt.name AS record_type_name,
      rt.balance_effect,
      c.id AS category_id,
      c.public_id AS category_public_id,
      c.name AS category_name,
      c.slug AS category_slug
    FROM record_types rt
    JOIN categories c ON c.record_type_id = rt.id
    WHERE rt.code = $1
      AND c.public_id = $2
      AND rt.is_active = TRUE
      AND c.is_active = TRUE
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [recordTypeCode.toLowerCase(), categoryPublicId]);
  return rows[0] ?? null;
}

async function findRecordById(id, client, options = {}) {
  const includeDeleted = options.includeDeleted ?? true;
  const conditions = ['fr.id = $1'];

  if (!includeDeleted) {
    conditions.push('fr.deleted_at IS NULL');
  }

  const sql = `
    ${recordSelectFrom}
    WHERE ${conditions.join(' AND ')}
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [id]);
  return rows[0] ?? null;
}

async function findRecordByPublicId(publicId, client, options = {}) {
  const includeDeleted = options.includeDeleted ?? false;
  const conditions = ['fr.public_id = $1'];

  if (!includeDeleted) {
    conditions.push('fr.deleted_at IS NULL');
  }

  const sql = `
    ${recordSelectFrom}
    WHERE ${conditions.join(' AND ')}
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [publicId]);
  return rows[0] ?? null;
}

async function listLookups(client) {
  const recordTypesSql = `
    SELECT code, name, balance_effect
    FROM record_types
    WHERE is_active = TRUE
    ORDER BY
      CASE balance_effect
        WHEN 1 THEN 0
        WHEN -1 THEN 1
        ELSE 2
      END,
      name ASC
  `;

  const categoriesSql = `
    SELECT
      c.public_id AS category_public_id,
      c.name AS category_name,
      c.slug AS category_slug,
      rt.code AS record_type_code,
      rt.name AS record_type_name,
      rt.balance_effect
    FROM categories c
    JOIN record_types rt ON rt.id = c.record_type_id
    WHERE c.is_active = TRUE
      AND rt.is_active = TRUE
    ORDER BY rt.name ASC, c.name ASC
  `;

  const [recordTypesResult, categoriesResult] = await Promise.all([
    runQuery(client, recordTypesSql),
    runQuery(client, categoriesSql),
  ]);

  return {
    categories: categoriesResult.rows,
    recordTypes: recordTypesResult.rows,
  };
}

async function createRecord(data, client) {
  const sql = `
    INSERT INTO financial_records (
      amount,
      currency_code,
      record_type_id,
      category_id,
      occurred_on,
      notes,
      created_by,
      updated_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    RETURNING id
  `;

  const { rows } = await runQuery(client, sql, [
    data.amount,
    data.currencyCode,
    data.recordTypeId,
    data.categoryId,
    data.occurredOn,
    data.notes ?? null,
    data.createdBy,
  ]);

  return findRecordById(rows[0].id, client, { includeDeleted: true });
}

async function updateRecord(publicId, updates, client) {
  const assignments = [];
  const params = [];

  if (updates.amount !== undefined) {
    params.push(updates.amount);
    assignments.push(`amount = $${params.length}`);
  }

  if (updates.currencyCode !== undefined) {
    params.push(updates.currencyCode);
    assignments.push(`currency_code = $${params.length}`);
  }

  if (updates.recordTypeId !== undefined) {
    params.push(updates.recordTypeId);
    assignments.push(`record_type_id = $${params.length}`);
  }

  if (updates.categoryId !== undefined) {
    params.push(updates.categoryId);
    assignments.push(`category_id = $${params.length}`);
  }

  if (updates.occurredOn !== undefined) {
    params.push(updates.occurredOn);
    assignments.push(`occurred_on = $${params.length}`);
  }

  if (updates.notes !== undefined) {
    params.push(updates.notes);
    assignments.push(`notes = $${params.length}`);
  }

  if (updates.updatedBy !== undefined) {
    params.push(updates.updatedBy);
    assignments.push(`updated_by = $${params.length}`);
  }

  assignments.push('updated_at = NOW()');
  params.push(publicId);

  const sql = `
    UPDATE financial_records
    SET ${assignments.join(', ')}
    WHERE public_id = $${params.length}
    RETURNING id
  `;

  const { rows } = await runQuery(client, sql, params);
  return rows[0] ? findRecordById(rows[0].id, client, { includeDeleted: true }) : null;
}

async function softDeleteRecord(publicId, deletedBy, client) {
  const sql = `
    UPDATE financial_records
    SET deleted_at = NOW(),
        deleted_by = $1,
        updated_by = $1,
        updated_at = NOW()
    WHERE public_id = $2
      AND deleted_at IS NULL
    RETURNING id
  `;

  const { rows } = await runQuery(client, sql, [deletedBy, publicId]);
  return rows[0] ? findRecordById(rows[0].id, client, { includeDeleted: true }) : null;
}

async function listRecords(filters, pagination, client) {
  const filterState = buildRecordFilters(filters, {
    includeDeleted: filters.includeDeleted,
  });

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM financial_records fr
    JOIN record_types rt ON rt.id = fr.record_type_id
    JOIN categories c ON c.id = fr.category_id
    JOIN users creator ON creator.id = fr.created_by
    ${filterState.whereClause}
  `;

  const countResult = await runQuery(client, countSql, filterState.params);
  const total = countResult.rows[0]?.total ?? 0;

  const dataParams = [...filterState.params, pagination.limit, pagination.offset];
  const dataSql = `
    ${recordSelectFrom}
    ${filterState.whereClause}
    ORDER BY fr.occurred_on DESC, fr.created_at DESC
    LIMIT $${filterState.params.length + 1}
    OFFSET $${filterState.params.length + 2}
  `;

  const dataResult = await runQuery(client, dataSql, dataParams);

  return {
    rows: dataResult.rows,
    total,
  };
}

module.exports = {
  createRecord,
  findRecordByPublicId,
  findTypeAndCategory,
  listLookups,
  listRecords,
  softDeleteRecord,
  updateRecord,
};
