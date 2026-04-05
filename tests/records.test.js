const authState = {
  permissions: ['records.create', 'records.read', 'records.update', 'records.delete'],
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

jest.mock('../src/modules/records/records.service', () => ({
  createRecord: jest.fn(),
  deleteRecord: jest.fn(),
  getLookups: jest.fn(),
  getRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const recordsService = require('../src/modules/records/records.service');

describe('Records routes', () => {
  beforeEach(() => {
    authState.permissions = ['records.create', 'records.read', 'records.update', 'records.delete'];
    jest.clearAllMocks();
  });

  it('returns active record types and categories for Swagger-driven testing', async () => {
    recordsService.getLookups.mockResolvedValue({
      categories: [
        {
          name: 'Salary',
          publicId: '11111111-1111-1111-1111-111111111111',
          recordType: { balanceEffect: 1, code: 'income', name: 'Income' },
          slug: 'salary',
        },
      ],
      recordTypes: [{ balanceEffect: 1, code: 'income', name: 'Income' }],
    });

    const response = await request(app).get('/records/lookups');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.recordTypes[0].code).toBe('income');
    expect(response.body.data.categories[0].slug).toBe('salary');
  });

  it('blocks lookups when the caller does not have records.read permission', async () => {
    authState.permissions = ['records.create'];

    const response = await request(app).get('/records/lookups');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Missing required permission: records.read.');
    expect(recordsService.getLookups).not.toHaveBeenCalled();
  });

  it('creates a record when the payload is valid', async () => {
    recordsService.createRecord.mockResolvedValue({
      amount: '1200.00',
      category: { name: 'Salary', publicId: '11111111-1111-1111-1111-111111111111', slug: 'salary' },
      currencyCode: 'INR',
      occurredOn: '2026-04-01',
      publicId: '22222222-2222-2222-2222-222222222222',
      recordType: { balanceEffect: 1, code: 'income', name: 'Income' },
    });

    const response = await request(app).post('/records').send({
      amount: 1200,
      categoryPublicId: '11111111-1111-1111-1111-111111111111',
      currencyCode: 'INR',
      occurredOn: '2026-04-01',
      recordTypeCode: 'income',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.publicId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('blocks record creation when the caller lacks records.create permission', async () => {
    authState.permissions = ['records.read'];

    const response = await request(app).post('/records').send({
      amount: 1200,
      categoryPublicId: '11111111-1111-1111-1111-111111111111',
      currencyCode: 'INR',
      occurredOn: '2026-04-01',
      recordTypeCode: 'income',
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Missing required permission: records.create.');
    expect(recordsService.createRecord).not.toHaveBeenCalled();
  });

  it('validates create payloads before reaching the service', async () => {
    const response = await request(app).post('/records').send({
      amount: -10,
      occurredOn: '2026/04/01',
      recordTypeCode: 'income',
    });

    expect(response.status).toBe(400);
    expect(recordsService.createRecord).not.toHaveBeenCalled();
  });

  it('lists records for authorized readers', async () => {
    recordsService.listRecords.mockResolvedValue({
      items: [
        {
          amount: '1200.00',
          category: {
            name: 'Salary',
            publicId: '11111111-1111-1111-1111-111111111111',
            slug: 'salary',
          },
          occurredOn: '2026-04-01',
          publicId: '22222222-2222-2222-2222-222222222222',
          recordType: { balanceEffect: 1, code: 'income', name: 'Income' },
        },
      ],
      pagination: { limit: 20, page: 1, total: 1, totalPages: 1 },
    });

    const response = await request(app).get('/records').query({ page: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('fetches a single record for authorized readers', async () => {
    recordsService.getRecord.mockResolvedValue({
      amount: '1200.00',
      publicId: '22222222-2222-2222-2222-222222222222',
    });

    const response = await request(app).get('/records/22222222-2222-2222-2222-222222222222');

    expect(response.status).toBe(200);
    expect(response.body.data.publicId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('updates a record for authorized writers', async () => {
    recordsService.updateRecord.mockResolvedValue({
      amount: '1450.00',
      publicId: '22222222-2222-2222-2222-222222222222',
    });

    const response = await request(app)
      .patch('/records/22222222-2222-2222-2222-222222222222')
      .send({ amount: 1450 });

    expect(response.status).toBe(200);
    expect(response.body.data.amount).toBe('1450.00');
  });

  it('deletes a record for authorized writers', async () => {
    recordsService.deleteRecord.mockResolvedValue({
      deletedAt: '2026-04-05T12:00:00.000Z',
      publicId: '22222222-2222-2222-2222-222222222222',
    });

    const response = await request(app).delete('/records/22222222-2222-2222-2222-222222222222');

    expect(response.status).toBe(200);
    expect(response.body.data.deletedAt).toBe('2026-04-05T12:00:00.000Z');
  });
});
