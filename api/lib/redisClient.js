const Redis = require('ioredis');

let client = null;
function init() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.REDIS || null;
  if (!url) return null;
  client = new Redis(url);
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
