const { query } = require('../../config/db');

function runQuery(client, text, params = []) {
  return client ? client.query(text, params) : query(text, params);
}

async function findUserAccessContextByPublicId(publicId, client) {
  const sql = `
    SELECT
      u.id,
      u.public_id,
      u.full_name,
      u.email,
      u.token_version,
      us.code AS status_code,
      us.name AS status_name,
      COALESCE(
        array_agg(DISTINCT r.code)
          FILTER (WHERE r.id IS NOT NULL AND ur.is_active = TRUE AND ur.revoked_at IS NULL),
        '{}'
      ) AS role_codes,
      COALESCE(
        array_agg(DISTINCT p.code)
          FILTER (WHERE p.id IS NOT NULL AND ur.is_active = TRUE AND ur.revoked_at IS NULL),
        '{}'
      ) AS permission_codes
    FROM users u
    JOIN user_statuses us ON us.id = u.status_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.public_id = $1 AND u.deleted_at IS NULL
    GROUP BY u.id, us.id
  `;

  const { rows } = await runQuery(client, sql, [publicId]);
  return rows[0] ?? null;
}

async function findRolesByCodes(roleCodes, client) {
  const sql = `
    SELECT id, code, name, description
    FROM roles
    WHERE code = ANY($1::varchar[])
      AND is_active = TRUE
    ORDER BY code ASC
  `;

  const { rows } = await runQuery(client, sql, [roleCodes]);
  return rows;
}

async function listActiveUserRoleAssignments(userId, client) {
  const sql = `
    SELECT ur.role_id, r.code, r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND ur.is_active = TRUE
      AND ur.revoked_at IS NULL
    ORDER BY r.code ASC
  `;

  const { rows } = await runQuery(client, sql, [userId]);
  return rows;
}

async function upsertUserRole(userId, roleId, assignedBy, client) {
  const sql = `
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active, revoked_at)
    VALUES ($1, $2, $3, NOW(), TRUE, NULL)
    ON CONFLICT (user_id, role_id)
    DO UPDATE SET
      assigned_by = EXCLUDED.assigned_by,
      assigned_at = NOW(),
      is_active = TRUE,
      revoked_at = NULL
    RETURNING id, user_id, role_id, assigned_by, assigned_at, is_active, revoked_at
  `;

  const { rows } = await runQuery(client, sql, [userId, roleId, assignedBy]);
  return rows[0];
}

async function revokeUserRolesNotIn(userId, roleIds, client) {
  if (!roleIds.length) {
    const sql = `
      UPDATE user_roles
      SET is_active = FALSE,
          revoked_at = NOW()
      WHERE user_id = $1
        AND is_active = TRUE
        AND revoked_at IS NULL
    `;

    await runQuery(client, sql, [userId]);
    return;
  }

  const sql = `
    UPDATE user_roles
    SET is_active = FALSE,
        revoked_at = NOW()
    WHERE user_id = $1
      AND is_active = TRUE
      AND revoked_at IS NULL
      AND role_id <> ALL($2::bigint[])
  `;

  await runQuery(client, sql, [userId, roleIds]);
}

async function insertAuditLog(
  { actorUserId, entityName, entityId, action, oldValues, newValues, ipAddress, userAgent },
  client
) {
  const sql = `
    INSERT INTO audit_logs (
      actor_user_id,
      entity_name,
      entity_id,
      action,
      old_values,
      new_values,
      ip_address,
      user_agent
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
    RETURNING id, created_at
  `;

  const { rows } = await runQuery(client, sql, [
    actorUserId,
    entityName,
    entityId,
    action,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ipAddress,
    userAgent,
  ]);

  return rows[0];
}

module.exports = {
  findRolesByCodes,
  findUserAccessContextByPublicId,
  insertAuditLog,
  listActiveUserRoleAssignments,
  revokeUserRolesNotIn,
  upsertUserRole,
};
