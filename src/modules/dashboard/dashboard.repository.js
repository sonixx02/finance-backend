const { query } = require('../../config/db');

function runQuery(text, params = []) {
  return query(text, params);
}

function buildFilters(filters) {
  const params = [];
  const conditions = ['fr.deleted_at IS NULL'];

  if (filters.recordTypeCode) {
    params.push(filters.recordTypeCode.toLowerCase());
    conditions.push(`rt.code = $${params.length}`);
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
    whereClause: `WHERE ${conditions.join(' AND ')}`,
  };
}

async function getSummary(filters) {
  const filterState = buildFilters(filters);
  const sql = `
    SELECT
      COALESCE(SUM(CASE WHEN rt.balance_effect = 1 THEN fr.amount ELSE 0 END), 0)::text AS total_income,
      COALESCE(SUM(CASE WHEN rt.balance_effect = -1 THEN fr.amount ELSE 0 END), 0)::text AS total_expense,
      COALESCE(SUM(fr.amount * rt.balance_effect), 0)::text AS net_balance,
      COUNT(*)::int AS record_count
    FROM financial_records fr
    JOIN record_types rt ON rt.id = fr.record_type_id
    ${filterState.whereClause}
  `;

  const { rows } = await runQuery(sql, filterState.params);
  return rows[0];
}

async function getCategoryTotals(filters) {
  const filterState = buildFilters(filters);
  const sql = `
    SELECT
      c.public_id AS category_public_id,
      c.name AS category_name,
      c.slug AS category_slug,
      rt.code AS record_type_code,
      rt.name AS record_type_name,
      COALESCE(SUM(fr.amount), 0)::text AS total_amount,
      COUNT(fr.id)::int AS record_count
    FROM financial_records fr
    JOIN record_types rt ON rt.id = fr.record_type_id
    JOIN categories c ON c.id = fr.category_id
    ${filterState.whereClause}
    GROUP BY c.id, rt.id
    ORDER BY SUM(fr.amount) DESC, c.name ASC
  `;

  const { rows } = await runQuery(sql, filterState.params);
  return rows;
}

async function getTrends(filters) {
  const filterState = buildFilters(filters);
  const granularity = filters.granularity === 'week' ? 'week' : 'month';
  const sql = `
    SELECT
      date_trunc('${granularity}', fr.occurred_on::timestamp)::date AS bucket_start,
      COALESCE(SUM(CASE WHEN rt.balance_effect = 1 THEN fr.amount ELSE 0 END), 0)::text AS total_income,
      COALESCE(SUM(CASE WHEN rt.balance_effect = -1 THEN fr.amount ELSE 0 END), 0)::text AS total_expense,
      COALESCE(SUM(fr.amount * rt.balance_effect), 0)::text AS net_balance,
      COUNT(fr.id)::int AS record_count
    FROM financial_records fr
    JOIN record_types rt ON rt.id = fr.record_type_id
    ${filterState.whereClause}
    GROUP BY bucket_start
    ORDER BY bucket_start ASC
  `;

  const { rows } = await runQuery(sql, filterState.params);
  return rows;
}

async function getRecentActivity(filters) {
  const filterState = buildFilters(filters);
  const params = [...filterState.params, filters.limit ?? 10];
  const sql = `
    SELECT
      fr.public_id,
      fr.amount::text AS amount,
      fr.currency_code,
      fr.occurred_on,
      fr.notes,
      fr.created_at,
      rt.code AS record_type_code,
      rt.name AS record_type_name,
      c.public_id AS category_public_id,
      c.name AS category_name,
      c.slug AS category_slug
    FROM financial_records fr
    JOIN record_types rt ON rt.id = fr.record_type_id
    JOIN categories c ON c.id = fr.category_id
    ${filterState.whereClause}
    ORDER BY fr.created_at DESC
    LIMIT $${filterState.params.length + 1}
  `;

  const { rows } = await runQuery(sql, params);
  return rows;
}

module.exports = {
  getCategoryTotals,
  getRecentActivity,
  getSummary,
  getTrends,
};
