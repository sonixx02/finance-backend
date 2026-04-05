# Finance Backend

An Express and PostgreSQL backend for a finance dashboard assignment. This version intentionally keeps the stronger backend design choices in place, but trims the public API to a smaller, easier-to-defend v1.

## What This Submission Keeps

- Layered structure with routes, controllers, services, repositories, middleware, and validations.
- Normalized PostgreSQL schema with dynamic RBAC tables, finance lookup tables, soft delete support, and audit storage.
- Short-lived JWT authentication with token version checks and permission-aware route guards.
- Records CRUD plus a focused dashboard summary endpoint.
- Seeded users, roles, permissions, record types, and categories for fast local testing.
- Swagger UI at `/docs`, backed by `swagger-ui-express` and a local OpenAPI spec, so reviewers can authenticate and exercise the kept endpoints quickly.
- Jest and Supertest route tests that cover auth, permissions, records, dashboard summary, and docs.

## What Was Intentionally Removed From The Public API

- Public `/users` management endpoints.
- Extra dashboard analytics endpoints for category totals, trends, and recent activity.
- Raw spec publishing at `/openapi.json`.

These features were cut from the submission surface to keep the project focused and clearly explainable. The schema and access-control design still support future expansion without redesigning the backend.

## Active API Surface

- `GET /health`
- `GET /docs`
- `POST /auth/login`
- `GET /records/lookups`
- `POST /records`
- `GET /records`
- `GET /records/:publicId`
- `PATCH /records/:publicId`
- `DELETE /records/:publicId`
- `GET /dashboard/summary`

## Swagger Workflow

1. Start the server with seeded data loaded.
2. Open `http://localhost:4000/docs`.
3. Call `POST /auth/login` with one of the seeded users.
4. Copy the returned bearer token into Swagger's `Authorize` dialog.
5. Call `GET /records/lookups` to fetch valid record types and category IDs.
6. Use those values for record creation and update requests.

## Seeded Users

All seeded users start in the `active` status.

- Admin: `admin@finance.local` / `Admin123!`
- Analyst: `analyst@finance.local` / `Analyst123!`
- Viewer: `viewer@finance.local` / `Viewer123!`

Default seeded permissions:

- `viewer`: `dashboard.read`
- `analyst`: `dashboard.read`, `records.read`
- `admin`: all seeded permissions

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Copy the example environment file.

```powershell
Copy-Item .env.example .env
```

3. Create the PostgreSQL database defined in `DATABASE_URL`.

4. Run the schema and seed scripts.

```bash
npm run db:migrate
npm run db:seed
```

5. Start the backend.

```bash
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

## Why The Schema Still Stays Rich

- Roles and permissions remain data-driven so new access rules can be added without changing table design.
- Finance lookups remain normalized so new record types and categories can be introduced safely.
- Audit storage remains in the schema even though this v1 focuses the public API elsewhere.
- The architecture shows system thinking without forcing reviewers through unnecessary endpoints.

## Future Improvements

- Re-expose admin-facing user management endpoints when the reviewer scope needs them.
- Add richer dashboard analytics back on top of the existing schema.
- Add stronger integration coverage against a real test database.
- Expand the OpenAPI spec with richer response examples if the reviewer scope grows.

## Helpful Scripts

- `npm run dev`
- `npm start`
- `npm test`
- `npm run lint`
- `npm run db:migrate`
- `npm run db:seed`

## GitHub Publish Prep

This folder is ready to become the repo root.

```bash
git init
git add .
git commit -m "Simplify finance backend v1 surface"
```

Then connect a remote and push:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

