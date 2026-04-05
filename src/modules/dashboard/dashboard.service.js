const dashboardRepository = require('./dashboard.repository');

function buildPeriod(filters) {
  return {
    endDate: filters.endDate ?? null,
    startDate: filters.startDate ?? null,
  };
}

async function getSummary(filters) {
  const row = await dashboardRepository.getSummary(filters);

  return {
    period: buildPeriod(filters),
    totals: {
      netBalance: row.net_balance,
      recordCount: row.record_count,
      totalExpense: row.total_expense,
      totalIncome: row.total_income,
    },
  };
}

async function getCategoryTotals(filters) {
  const rows = await dashboardRepository.getCategoryTotals(filters);

  return {
    items: rows.map((row) => ({
      category: {
        name: row.category_name,
        publicId: row.category_public_id,
        slug: row.category_slug,
      },
      recordCount: row.record_count,
      recordType: {
        code: row.record_type_code,
        name: row.record_type_name,
      },
      totalAmount: row.total_amount,
    })),
    period: buildPeriod(filters),
  };
}

async function getTrends(filters) {
  const rows = await dashboardRepository.getTrends(filters);

  return {
    granularity: filters.granularity,
    items: rows.map((row) => ({
      bucketStart: row.bucket_start,
      netBalance: row.net_balance,
      recordCount: row.record_count,
      totalExpense: row.total_expense,
      totalIncome: row.total_income,
    })),
    period: buildPeriod(filters),
  };
}

async function getRecentActivity(filters) {
  const rows = await dashboardRepository.getRecentActivity(filters);

  return {
    items: rows.map((row) => ({
      amount: row.amount,
      category: {
        name: row.category_name,
        publicId: row.category_public_id,
        slug: row.category_slug,
      },
      createdAt: row.created_at,
      currencyCode: row.currency_code,
      notes: row.notes,
      occurredOn: row.occurred_on,
      publicId: row.public_id,
      recordType: {
        code: row.record_type_code,
        name: row.record_type_name,
      },
    })),
    limit: filters.limit ?? 10,
    period: buildPeriod(filters),
  };
}

module.exports = {
  getCategoryTotals,
  getRecentActivity,
  getSummary,
  getTrends,
};
