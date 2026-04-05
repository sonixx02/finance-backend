const { query } = require('../../config/db');

function runQuery(client, text, params = []) {
  return client ? client.query(text, params) : query(text, params);
}

async function findUserByEmailForLogin(email, client) {
  const sql = `
    SELECT
      u.id,
      u.public_id,
      u.full_name,
      u.email,
      u.password_hash,
      u.token_version,
      us.code AS status_code,
      us.name AS status_name
    FROM users u
    JOIN user_statuses us ON us.id = u.status_id
    WHERE LOWER(u.email) = LOWER($1)
      AND u.deleted_at IS NULL
    LIMIT 1
  `;

  const { rows } = await runQuery(client, sql, [email]);
  return rows[0] ?? null;
}

module.exports = {
  findUserByEmailForLogin,
};
