const request = require('supertest');
const app = require('../src/app');

describe('GET /docs', () => {
  it('serves Swagger UI for the kept v1 surface only', async () => {
    const pageResponse = await request(app).get('/docs/');
    const initResponse = await request(app).get('/docs/swagger-ui-init.js');

    expect(pageResponse.status).toBe(200);
    expect(pageResponse.type).toMatch(/html/);
    expect(pageResponse.text).toContain('Finance Backend API Docs');

    expect(initResponse.status).toBe(200);
    expect(initResponse.type).toMatch(/javascript/);
    expect(initResponse.text).toContain('/records/lookups');
    expect(initResponse.text).toContain('/dashboard/summary');
    expect(initResponse.text).not.toContain('/users');
    expect(initResponse.text).not.toContain('/dashboard/trends');
    expect(initResponse.text).not.toContain('/openapi.json');
  });
});
