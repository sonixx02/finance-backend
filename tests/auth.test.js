const request = require('supertest');
const ApiError = require('../src/utils/apiError');

jest.mock('../src/modules/auth/auth.service', () => ({
  login: jest.fn(),
}));

const app = require('../src/app');
const authService = require('../src/modules/auth/auth.service');

describe('POST /auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an access token for valid credentials', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'token',
      expiresIn: '15m',
      user: {
        email: 'admin@finance.local',
        fullName: 'System Admin',
        permissions: ['users.manage'],
        publicId: 'user-public-id',
        roles: [{ code: 'admin' }],
        status: { code: 'active', name: 'Active' },
      },
    });

    const response = await request(app).post('/auth/login').send({
      email: 'admin@finance.local',
      password: 'Admin123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('token');
  });

  it('rejects invalid payloads before reaching the service', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'bad-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('returns a forbidden response for inactive users', async () => {
    authService.login.mockRejectedValue(ApiError.forbidden('User account is not active.'));

    const response = await request(app).post('/auth/login').send({
      email: 'inactive@finance.local',
      password: 'Inactive123!',
    });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User account is not active.');
  });
});
