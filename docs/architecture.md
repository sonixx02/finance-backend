# Architecture Notes

This backend is structured to reflect the assignment's core concerns: user and role management, financial record operations, dashboard analytics, and backend-enforced access control.

## Main Structure

- API layer: Express routes and controllers.
- Service layer: business rules, orchestration, and transaction boundaries.
- Repository layer: PostgreSQL queries and data access.
- Middleware layer: authentication, authorization, validation, and centralized error handling.
- Persistence layer: normalized PostgreSQL schema with IAM, finance, and audit tables.

## Authentication And Authorization

- `POST /auth/login` verifies bcrypt password hashes and issues JWTs.
- Tokens carry the user's public id, token version, and active role codes.
- `auth.middleware.js` reloads the user's access context from PostgreSQL on protected requests so status and permission changes take effect quickly.
- `requirePermission.js` enforces route-level permissions such as `users.manage`, `records.create`, and `dashboard.read`.

## User Management

- Users are stored with statuses such as `active`, `inactive`, and `suspended`.
- Roles and permissions are fully data-driven through `roles`, `permissions`, `role_permissions`, and `user_roles`.
- The public API supports creating users, listing users, updating user status, and replacing assigned roles.
- Role and status changes bump `token_version` so older JWTs stop working.

## Financial Records

- Financial records use `NUMERIC(14,2)` and support create, list, detail, update, and soft delete flows.
- Record types and categories remain data-driven and validated both in application logic and in PostgreSQL constraints.
- `GET /records/lookups` exists to make the API easier to test from Swagger because categories use generated public ids.
- Record writes are wrapped in transactions and mirrored into `audit_logs`.

## Dashboard Analytics

- Summary, category totals, trends, and recent activity are all exposed through dedicated endpoints.
- Aggregation runs directly in SQL to keep the backend efficient and predictable.
- Trends are limited to `week` and `month` granularity to keep the API and query behavior focused.

## Why This Matches The Assignment Well

- It demonstrates CRUD plus aggregation, not only basic record storage.
- It shows role-based access control as actual backend enforcement, not just documentation.
- It keeps the schema normalized and extensible without turning the codebase into unnecessary abstraction.
- It includes validation, error handling, persistence, audit logging, tests, and API documentation.
