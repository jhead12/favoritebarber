const Redis = require('ioredis');

let client = null;
function init() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.REDIS || null;
  if (url) {
    client = new Redis(url);
  } else {
    const host = process.env.REDIS_HOST || process.env.REDIS || '127.0.0.1';
    const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0;
    try {
      client = new Redis({ host, port, db });
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
