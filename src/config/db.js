const { Pool } = require('pg');

const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  family: 4
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error.', error.message);
});

function query(text, params = [], client = pool) {
  return client.query(text, params);
}

async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  closePool,
  pool,
  query,
  withTransaction,
};
