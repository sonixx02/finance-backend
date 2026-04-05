const authState = {
  permissions: ['users.manage', 'users.read'],
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

jest.mock('../src/modules/users/users.service', () => ({
  createUser: jest.fn(),
  listUsers: jest.fn(),
  updateUserRoles: jest.fn(),
  updateUserStatus: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const usersService = require('../src/modules/users/users.service');

describe('Users routes', () => {
  beforeEach(() => {
    authState.permissions = ['users.manage', 'users.read'];
    jest.clearAllMocks();
  });

  it('creates a user when the payload is valid', async () => {
    usersService.createUser.mockResolvedValue({
      email: 'new@finance.local',
      fullName: 'New User',
      publicId: '33333333-3333-3333-3333-333333333333',
      roles: [{ code: 'viewer', name: 'Viewer' }],
      status: { code: 'active', name: 'Active' },
    });

    const response = await request(app).post('/users').send({
      email: 'new@finance.local',
      fullName: 'New User',
      password: 'NewUser123!',
      roleCodes: ['viewer'],
      statusCode: 'active',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.publicId).toBe('33333333-3333-3333-3333-333333333333');
  });

  it('lists users for authorized readers', async () => {
    usersService.listUsers.mockResolvedValue({
      items: [{ email: 'admin@finance.local', publicId: '11111111-1111-1111-1111-111111111111' }],
      pagination: { limit: 20, page: 1, total: 1, totalPages: 1 },
    });

    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('updates user status for managers', async () => {
    usersService.updateUserStatus.mockResolvedValue({
      publicId: '11111111-1111-1111-1111-111111111111',
      status: { code: 'inactive', name: 'Inactive' },
    });

    const response = await request(app)
      .patch('/users/11111111-1111-1111-1111-111111111111/status')
      .send({ statusCode: 'inactive' });

    expect(response.status).toBe(200);
    expect(response.body.data.status.code).toBe('inactive');
  });

  it('updates user roles for managers', async () => {
    usersService.updateUserRoles.mockResolvedValue({
      publicId: '11111111-1111-1111-1111-111111111111',
      roles: [{ code: 'admin', name: 'Admin' }],
    });

    const response = await request(app)
      .patch('/users/11111111-1111-1111-1111-111111111111/roles')
      .send({ roleCodes: ['admin'] });

    expect(response.status).toBe(200);
    expect(response.body.data.roles[0].code).toBe('admin');
  });

  it('blocks create when the caller lacks users.manage permission', async () => {
    authState.permissions = ['users.read'];

    const response = await request(app).post('/users').send({
      email: 'new@finance.local',
      fullName: 'New User',
      password: 'NewUser123!',
      roleCodes: ['viewer'],
      statusCode: 'active',
    });

    expect(response.status).toBe(403);
    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('validates create payloads before reaching the service', async () => {
    const response = await request(app).post('/users').send({
      email: 'bad-email',
      fullName: 'N',
      password: 'short',
      roleCodes: [],
      statusCode: '',
    });

    expect(response.status).toBe(400);
    expect(usersService.createUser).not.toHaveBeenCalled();
  });
});
