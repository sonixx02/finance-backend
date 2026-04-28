# Finance Backend

An Express and PostgreSQL backend The project focuses on clear backend structure, data modeling, role-based access control, validation, and dashboard aggregation APIs.

## What Is Included

- Layered structure with routes, controllers, services, repositories, middleware, and validations.
- PostgreSQL schema with dynamic RBAC tables, finance lookup tables, soft delete support, and audit logs.
- JWT authentication with token version checks and permission-based route guards.
- User management, records CRUD, and dashboard analytics endpoints.
- Swagger UI at `/docs`, backed by `swagger-ui-express` and a local OpenAPI spec.
- Jest and Supertest route tests for auth, users, records, dashboard, and docs.

## Active API Surface

- `GET /health`
- `GET /docs`
- `POST /auth/login`
- `POST /users`
- `GET /users`
- `PATCH /users/:publicId/status`
- `PATCH /users/:publicId/roles`
- `GET /records/lookups`
- `POST /records`
- `GET /records`
- `GET /records/:publicId`
- `PATCH /records/:publicId`
- `DELETE /records/:publicId`
- `GET /dashboard/summary`
- `GET /dashboard/category-totals`
- `GET /dashboard/trends`
- `GET /dashboard/recent-activity`

## Swagger Workflow

1. Open `/docs`.
2. Call `POST /auth/login` with a seeded user email and password.
3. Copy the returned JWT access token into Swagger's `Authorize` dialog.
4. Paste only the token value there. Do not paste the password, and do not manually add `Bearer ` because Swagger does that for you.
5. Use the protected users, records, and dashboard routes based on that user's permissions.
6. Call `GET /records/lookups` before creating or updating records so you can use valid category IDs.

## Seeded Users

- Admin: `admin@finance.local` / `Admin123!`
- Analyst: `analyst@finance.local` / `Analyst123!`
- Viewer: `viewer@finance.local` / `Viewer123!`

Default seeded permissions:

- `viewer`: `dashboard.read`
- `analyst`: `dashboard.read`, `records.read`
- `admin`: all seeded permissions

## Quick Start

```bash
npm install
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Environment Variables

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_dashboard
DATABASE_SSL=false
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=15m
LOG_LEVEL=info
BCRYPT_ROUNDS=10
```

## Design Notes

- Roles and permissions are data-driven, so future access changes do not require redesigning the schema.
- Record types and categories are also data-driven rather than hardcoded constants.
- Monetary amounts use `NUMERIC(14,2)` and are returned as strings to avoid precision loss.
- Record writes and user access changes are logged into `audit_logs`.
- Dashboard summaries and trends are computed in SQL rather than in application memory.

## Helpful Scripts

- `npm run dev`
- `npm start`
- `npm test`
- `npm run lint`
- `npm run db:migrate`
- `npm run db:seed`



