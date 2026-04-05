# Architecture Notes

We started from the database side because most of the real complexity in this backend is not in Express routes. The harder part is keeping users, permissions, financial records, and summaries consistent over time. Because of that, we treated the schema as the center of the project and let the API shape itself around that.

We also tried to avoid hardcoding business vocabulary in code when it looked likely to change later. Roles, permissions, user statuses, record types, and categories all live as rows in tables instead of constants scattered through controllers. That means a new role, a new status, or a new finance category is usually a data change first, not a backend redesign.

## the backend

The request path is intentionally simple: route, validation, auth or permission checks, service, repository, response. Controllers stay thin, services hold business rules and transaction boundaries, repositories hold SQL, and middleware handles cross-cutting things like JWT checks, validation errors, and common error formatting. We kept that split because once auth and dashboard queries get a little heavier, mixing SQL, HTTP handling, and permission logic in one place becomes hard to reason about.

Another small but important backend decision was the health check. A server that responds from Express but cannot reach PostgreSQL is not actually healthy for this app, so the health endpoint now checks database reachability too.

## The schema and why it looks this way

The identity side starts with `user_statuses` and `users`. We kept statuses in a table instead of turning them into code-only enums because status is part of the domain, not just a UI detail. `users` stores both an internal numeric key and a `public_id`. The numeric id keeps joins efficient inside PostgreSQL, while the UUID lets the API expose something stable without leaking sequential database ids.

`users` also has `token_version`, and that column is there for a very practical reason. If a user's roles change or the account is suspended, we do not want older JWTs to keep working until they expire. Bumping `token_version` gives us a clean way to invalidate older tokens immediately.

For access control, we separated `roles`, `permissions`, `role_permissions`, and `user_roles`. It is more relational structure than a rushed demo would need, but it keeps the permission model clean. Permissions stay reusable, roles stay descriptive, and the system can support multiple roles per user later without changing the schema. Even though the seed data is simple, the backend is not boxed into that simplicity.

On the finance side, `record_types` and `categories` are also data-driven. We did not want values like `income` and `expense` spread through many files as hardcoded rules. `record_types` carries a `balance_effect` field, which is one of the more useful schema decisions here. Instead of teaching every dashboard query how each type should affect totals, the database already knows whether a type adds to balance, subtracts from it, or is neutral.

`categories` belongs to a record type, and `financial_records` stores both `record_type_id` and `category_id`. At first glance that can look a little redundant, but it is deliberate. The composite foreign key makes PostgreSQL enforce that a record cannot point to a category that belongs to the wrong type. We wanted that rule to live in the database itself, not only in service-layer checks.

Amounts are stored as `NUMERIC(14,2)` because this is finance data and exact values matter more than convenience. We also included `created_by`, `updated_by`, `deleted_by`, and `deleted_at` in `financial_records` so we can keep history and support soft delete without losing who touched a row.

`audit_logs` is kept separate from the main tables as an append-only history. That keeps the core record tables focused on current state while still giving us a place to capture what changed, who changed it, and when it happened.

We also shaped indexes around the actual read paths instead of indexing everything blindly. Active users, active role assignments, and non-deleted financial records are the rows we care about most often, so the partial indexes follow those filters. Soft delete is only worth doing if common reads still stay efficient.

## How a request moves through the backend

A login request starts with payload validation, then we load the user by email, verify the bcrypt hash, check that the account is active, load the current access context, and only then sign the JWT. The token is intentionally small: public id, token version, and role codes. That gives the client what it needs without turning the token into the only source of truth.

Protected routes do not trust the JWT alone. The middleware verifies the token, then reloads the user's current access context from PostgreSQL before permission checks run. That choice was important because role or status updates should take effect immediately. If we trusted only token contents, a user could keep access until the token expired even after an admin changed their permissions.

For record writes, the service layer owns the rule checks and transaction boundaries, and the repository layer owns the actual SQL. We kept audit log writes close to the same flow because a finance write without traceability feels incomplete.

Dashboard endpoints stay close to SQL on purpose. Totals, category breakdowns, trends, and recent activity are all better computed where the data already lives. Pulling large record sets into Node just to sum or group them would make the backend noisier, slower, and easier to get subtly wrong.

`GET /records/lookups` is a small example of a backend decision that makes the whole API easier to use. Categories use generated public ids, so giving clients a way to fetch valid types and categories first makes create and update requests much more reliable.




