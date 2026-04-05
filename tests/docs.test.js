const request = require('supertest');
const app = require('../src/app');

describe('GET /docs', () => {
  it('serves Swagger UI for the kept assignment surface', async () => {
    const pageResponse = await request(app).get('/docs/');
    const initResponse = await request(app).get('/docs/swagger-ui-init.js');

    expect(pageResponse.status).toBe(200);
    expect(pageResponse.type).toMatch(/html/);
    expect(pageResponse.text).toContain('Finance Backend API Docs');

    expect(initResponse.status).toBe(200);
    expect(initResponse.type).toMatch(/javascript/);
    expect(initResponse.text).toContain('/users');
    expect(initResponse.text).toContain('/users/{publicId}/status');
    expect(initResponse.text).toContain('/users/{publicId}/roles');
    expect(initResponse.text).toContain('/dashboard/category-totals');
    expect(initResponse.text).toContain('/dashboard/trends');
    expect(initResponse.text).toContain('/dashboard/recent-activity');
    expect(initResponse.text).toContain('/records/lookups');
  });
});
