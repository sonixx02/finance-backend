const { query } = require('../../config/db');

function runQuery(text, params = []) {
  return query(text, params);
}

function buildFilters(filters) {
  const params = [];
  const conditions = ['fr.deleted_at IS NULL'];

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

module.exports = {
  getSummary,
};
