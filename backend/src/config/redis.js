const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

const getClient = async () => {
  if (client && client.isOpen) return client;

  client = redis.createClient({ url: config.redis.url });

  client.on('error', (err) => logger.warn('Redis error (non-fatal):', err.message));
  client.on('connect', () => logger.info('Redis connected'));

  try {
    await client.connect();
  } catch (err) {
    logger.warn('Redis unavailable — caching disabled:', err.message);
    client = null;
  }

  return client;
};

/**
 * Get a JSON value from Redis.  Returns null if missing or Redis is down.
 */
const get = async (key) => {
  const c = await getClient();
  if (!c) return null;
  try {
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

/**
 * Set a JSON value in Redis with optional TTL (seconds).
 */
const set = async (key, value, ttlSeconds = 3600) => {
  const c = await getClient();
  if (!c) return;
  try {
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    /* silently skip */
  }
};

const del = async (key) => {
  const c = await getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch {
    /* silently skip */
  }
};

module.exports = { getClient, get, set, del };
