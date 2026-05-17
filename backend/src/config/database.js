const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: config.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL error:', err);
});

/**
 * Run a query against the pool.
 * @param {string} text  - SQL string
 * @param {any[]}  params - Parameterised values
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  logger.debug(`DB query [${Date.now() - start}ms]: ${text.slice(0, 80)}`);
  return res;
};

/**
 * Grab a dedicated client for transactions.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
