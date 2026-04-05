const { query } = require('../../config/db');

function runQuery(client, text, params = []) {
  return client ? client.query(text, params) : query(text, params);
}

const userDetailsSelect = `
  SELECT
    u.id,
    u.public_id,
    u.full_name,
    u.email,
    u.token_version,
    u.created_at,
    u.updated_at,
    us.code AS status_code,
    us.name AS status_name,
    COALESCE(
      json_agg(DISTINCT jsonb_build_object('code', r.code, 'name', r.name))
        FILTER (WHERE r.id IS NOT NULL AND ur.is_active = TRUE AND ur.revoked_at IS NULL),
      '[]'::json
    ) AS roles
  FROM users u
  JOIN user_statuses us ON us.id = u.status_id
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
`;

async function findStatusByCode(code, client) {
  const sql = `
    SELECT id, code, name
    FROM user_statuses
    WHERE code = $1
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [code]);
  return rows[0] ?? null;
}

async function createUser({ fullName, email, passwordHash, statusId }, client) {
  const sql = `
    INSERT INTO users (full_name, email, password_hash, status_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, public_id, full_name, email, token_version, created_at, updated_at
  `;

  const { rows } = await runQuery(client, sql, [fullName, email, passwordHash, statusId]);
  return rows[0];
}

async function findUserByPublicId(publicId, client) {
  const sql = `
    SELECT
      u.id,
      u.public_id,
      u.full_name,
      u.email,
      u.token_version,
      u.created_at,
      u.updated_at,
      us.code AS status_code,
      us.name AS status_name
    FROM users u
    JOIN user_statuses us ON us.id = u.status_id
    WHERE u.public_id = $1
      AND u.deleted_at IS NULL
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [publicId]);
  return rows[0] ?? null;
}

async function getUserDetailsByPublicId(publicId, client) {
  const sql = `
    ${userDetailsSelect}
    WHERE u.public_id = $1
      AND u.deleted_at IS NULL
    GROUP BY u.id, us.id
  `;

  const { rows } = await runQuery(client, sql, [publicId]);
  return rows[0] ?? null;
}

async function incrementTokenVersion(userId, client) {
  const sql = `
    UPDATE users
    SET token_version = token_version + 1,
        updated_at = NOW()
    WHERE id = $1
    RETURNING token_version
  `;

  const { rows } = await runQuery(client, sql, [userId]);
  return rows[0] ?? null;
}

async function updateUserStatus(userId, statusId, client) {
  const sql = `
    UPDATE users
    SET status_id = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, public_id, full_name, email, token_version, created_at, updated_at
  `;

  const { rows } = await runQuery(client, sql, [userId, statusId]);
  return rows[0] ?? null;
}

async function listUsers(filters, pagination, client) {
  const params = [];
  const conditions = ['u.deleted_at IS NULL'];

  if (filters.statusCode) {
    params.push(filters.statusCode.toLowerCase());
    conditions.push(`us.code = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(`(LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`);
  }

  if (filters.roleCode) {
    params.push(filters.roleCode.toLowerCase());
    conditions.push(`EXISTS (
      SELECT 1
      FROM user_roles fur
      JOIN roles fr ON fr.id = fur.role_id
      WHERE fur.user_id = u.id
        AND fur.is_active = TRUE
        AND fur.revoked_at IS NULL
        AND fr.code = $${params.length}
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM users u
    JOIN user_statuses us ON us.id = u.status_id
    ${whereClause}
  `;

  const totalResult = await runQuery(client, countSql, params);
  const total = totalResult.rows[0]?.total ?? 0;

  const dataParams = [...params, pagination.limit, pagination.offset];
  const dataSql = `
    ${userDetailsSelect}
    ${whereClause}
    GROUP BY u.id, us.id
    ORDER BY u.created_at DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  const dataResult = await runQuery(client, dataSql, dataParams);

  return {
    rows: dataResult.rows,
    total,
  };
}

module.exports = {
  createUser,
  findStatusByCode,
  findUserByPublicId,
  getUserDetailsByPublicId,
  incrementTokenVersion,
  listUsers,
  updateUserStatus,
};
