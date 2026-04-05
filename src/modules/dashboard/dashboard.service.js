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

module.exports = {
  getSummary,
};
