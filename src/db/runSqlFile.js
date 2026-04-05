const fs = require('fs/promises');
const path = require('path');

const logger = require('../config/logger');
const { closePool, query } = require('../config/db');

async function run() {
  const [relativeFilePath] = process.argv.slice(2);

  if (!relativeFilePath) {
    throw new Error('A SQL file path is required.');
  }

  const filePath = path.resolve(process.cwd(), relativeFilePath);
  const sql = await fs.readFile(filePath, 'utf8');

  await query(sql);
  logger.info(`Executed SQL file: ${filePath}`);
}

run()
  .then(async () => {
    await closePool();
  })
  .catch(async (error) => {
    logger.error('Failed to execute SQL file.', error.message);
    await closePool();
    process.exit(1);
  });
