INSERT INTO user_statuses (code, name, description)
VALUES
  ('active', 'Active', 'User can authenticate and use the system.'),
  ('inactive', 'Inactive', 'User exists but cannot sign in.'),
  ('suspended', 'Suspended', 'User access is temporarily blocked.')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO roles (code, name, description)
VALUES
  ('viewer', 'Viewer', 'Can view dashboard data only.'),
  ('analyst', 'Analyst', 'Can read dashboard and financial records.'),
  ('admin', 'Admin', 'Full access to users, records, and dashboard.')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = TRUE;

INSERT INTO permissions (resource, action, code, description)
VALUES
  ('dashboard', 'read', 'dashboard.read', 'View dashboard analytics.'),
  ('records', 'read', 'records.read', 'View financial records.'),
  ('records', 'create', 'records.create', 'Create financial records.'),
  ('records', 'update', 'records.update', 'Update financial records.'),
  ('records', 'delete', 'records.delete', 'Soft delete financial records.'),
  ('users', 'read', 'users.read', 'View users.'),
  ('users', 'manage', 'users.manage', 'Create users, update status, and manage roles.')
ON CONFLICT (code) DO UPDATE
SET
  description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (
  (r.code = 'viewer' AND p.code IN ('dashboard.read')) OR
  (r.code = 'analyst' AND p.code IN ('dashboard.read', 'records.read')) OR
  (r.code = 'admin')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO record_types (code, name, balance_effect, description)
VALUES
  ('income', 'Income', 1, 'Funds that increase balance.'),
  ('expense', 'Expense', -1, 'Funds that decrease balance.')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  balance_effect = EXCLUDED.balance_effect,
  description = EXCLUDED.description,
  is_active = TRUE;

INSERT INTO categories (record_type_id, name, slug, description)
SELECT rt.id, seed.name, seed.slug, seed.description
FROM record_types rt
JOIN (
  VALUES
    ('income', 'Salary', 'salary', 'Primary recurring salary income.'),
    ('income', 'Freelance', 'freelance', 'Freelance or side-project income.'),
    ('income', 'Investments', 'investments', 'Returns from investments.'),
    ('expense', 'Rent', 'rent', 'Housing rent or lease expenses.'),
    ('expense', 'Groceries', 'groceries', 'Food and household essentials.'),
    ('expense', 'Utilities', 'utilities', 'Electricity, water, gas, and internet.'),
    ('expense', 'Travel', 'travel', 'Commute and trip related costs.')
) AS seed(type_code, name, slug, description)
  ON rt.code = seed.type_code
ON CONFLICT (record_type_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO users (full_name, email, password_hash, status_id)
SELECT seed.full_name, seed.email, crypt(seed.password, gen_salt('bf')), us.id
FROM user_statuses us
JOIN (
  VALUES
    ('System Admin', 'admin@finance.local', 'Admin123!'),
    ('Finance Analyst', 'analyst@finance.local', 'Analyst123!'),
    ('Dashboard Viewer', 'viewer@finance.local', 'Viewer123!')
) AS seed(full_name, email, password)
  ON us.code = 'active'
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  status_id = EXCLUDED.status_id,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, revoked_at)
SELECT u.id, r.id, NULL, NOW(), TRUE, NULL
FROM users u
JOIN roles r ON (
  (u.email = 'admin@finance.local' AND r.code = 'admin') OR
  (u.email = 'analyst@finance.local' AND r.code = 'analyst') OR
  (u.email = 'viewer@finance.local' AND r.code = 'viewer')
)
ON CONFLICT (user_id, role_id) DO UPDATE
SET
  is_active = TRUE,
  revoked_at = NULL,
  assigned_at = NOW();
