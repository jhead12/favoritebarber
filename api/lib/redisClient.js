const Redis = require('ioredis');

let client = null;
function init() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.REDIS || null;
  // Configure fail-fast options so commands don't hang when Redis is down
  const defaultOpts = {
    // Don't queue commands while disconnected
    enableOfflineQueue: false,
    // Fail fast on commands when not connected
    maxRetriesPerRequest: 0,
    // Short connect timeout for tests/local runs
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT_MS ? Number(process.env.REDIS_CONNECT_TIMEOUT_MS) : 1000
  };

  if (url) {
    client = new Redis(url, defaultOpts);
  } else {
    const host = process.env.REDIS_HOST || process.env.REDIS || '127.0.0.1';
    const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0;
    try {
      client = new Redis(Object.assign({ host, port, db }, defaultOpts));
    } catch (e) {
      return null;
    }
  }
  client.on('error', (err) => console.warn('Redis error', err));
  return client;
}

function getClient() {
  return client || init();
}

async function get(key) {
  const c = getClient();
  if (!c) return null;
  try {
    const v = await c.get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    console.warn('redis get error', e);
    return null;
  }
}

async function set(key, value, ttlMs) {
  const c = getClient();
  if (!c) return false;
  try {
    const s = JSON.stringify(value);
    if (ttlMs) {
      await c.set(key, s, 'PX', ttlMs);
    } else {
      await c.set(key, s);
    }
    return true;
  } catch (e) {
    console.warn('redis set error', e);
    return false;
  }
}

module.exports = { init, getClient, get, set };
