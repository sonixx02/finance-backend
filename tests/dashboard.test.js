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
  getSummary: jest.fn(),
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

  it('blocks summary access when the caller lacks dashboard.read permission', async () => {
    authState.permissions = ['records.read'];

    const response = await request(app).get('/dashboard/summary');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Missing required permission: dashboard.read.');
    expect(dashboardService.getSummary).not.toHaveBeenCalled();
  });

  it('validates summary query params', async () => {
    const response = await request(app).get('/dashboard/summary').query({
      startDate: '2026/04/01',
    });

    expect(response.status).toBe(400);
    expect(dashboardService.getSummary).not.toHaveBeenCalled();
  });

  it('returns 404 for removed analytics routes', async () => {
    const response = await request(app).get('/dashboard/trends');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Route not found.');
  });
});
