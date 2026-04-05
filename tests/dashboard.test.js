const authState = {
  permissions: ['dashboard.read'],
  publicId: 'user-public-id',
  userId: 1,
};

jest.mock('../src/middleware/auth.middleware', () => (req, res, next) => {
  void res;
  req.auth = {
    permissions: [...authState.permissions],
    publicId: authState.publicId,
    userId: authState.userId,
  };
  next();
});

jest.mock('../src/modules/dashboard/dashboard.service', () => ({
  getCategoryTotals: jest.fn(),
  getRecentActivity: jest.fn(),
  getSummary: jest.fn(),
  getTrends: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const dashboardService = require('../src/modules/dashboard/dashboard.service');

describe('Dashboard routes', () => {
  beforeEach(() => {
    authState.permissions = ['dashboard.read'];
    jest.clearAllMocks();
  });

  it('returns dashboard summary data', async () => {
    dashboardService.getSummary.mockResolvedValue({
      period: { endDate: null, startDate: null },
      totals: {
        netBalance: '1000.00',
        recordCount: 3,
        totalExpense: '500.00',
        totalIncome: '1500.00',
      },
    });

    const response = await request(app).get('/dashboard/summary');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totals.netBalance).toBe('1000.00');
  });

  it('returns category totals for authorized readers', async () => {
    dashboardService.getCategoryTotals.mockResolvedValue({
      items: [
        {
          category: { name: 'Salary', publicId: '11111111-1111-1111-1111-111111111111', slug: 'salary' },
          recordCount: 2,
          recordType: { code: 'income', name: 'Income' },
          totalAmount: '3000.00',
        },
      ],
      period: { endDate: null, startDate: null },
    });

    const response = await request(app).get('/dashboard/category-totals');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].totalAmount).toBe('3000.00');
  });

  it('returns trend data for authorized readers', async () => {
    dashboardService.getTrends.mockResolvedValue({
      granularity: 'month',
      items: [{ bucketStart: '2026-04-01', netBalance: '1000.00', recordCount: 3, totalExpense: '500.00', totalIncome: '1500.00' }],
      period: { endDate: null, startDate: null },
    });

    const response = await request(app).get('/dashboard/trends').query({ granularity: 'month' });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].bucketStart).toBe('2026-04-01');
  });

  it('returns recent activity for authorized readers', async () => {
    dashboardService.getRecentActivity.mockResolvedValue({
      items: [{ amount: '1200.00', publicId: '22222222-2222-2222-2222-222222222222' }],
      limit: 10,
      period: { endDate: null, startDate: null },
    });

    const response = await request(app).get('/dashboard/recent-activity');

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].publicId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('blocks dashboard access when the caller lacks dashboard.read permission', async () => {
    authState.permissions = ['records.read'];

    const response = await request(app).get('/dashboard/summary');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Missing required permission: dashboard.read.');
    expect(dashboardService.getSummary).not.toHaveBeenCalled();
  });

  it('validates trend query params', async () => {
    const response = await request(app).get('/dashboard/trends').query({
      granularity: 'day',
    });

    expect(response.status).toBe(400);
    expect(dashboardService.getTrends).not.toHaveBeenCalled();
  });
});
