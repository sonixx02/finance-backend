jest.mock('../src/config/db', () => ({
  closePool: jest.fn(),
  pool: {},
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const request = require('supertest');

const app = require('../src/app');
const { query } = require('../src/config/db');

describe('GET /health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns healthy when the database responds', async () => {
    query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Finance backend is healthy.',
    });
  });

  it('returns service unavailable when the database check fails', async () => {
    query.mockRejectedValue(new Error('db unavailable'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      message: 'Finance backend database is unavailable.',
      code: 'DATABASE_UNAVAILABLE',
    });
  });
});
