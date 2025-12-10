// Simple in-memory cache for geocode responses.
// Keyed by `${lat},${lon}`. TTL is configurable; default 24 hours.
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

function makeKey(lat, lon) {
  return `${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`;
}

function get(lat, lon) {
  const key = makeKey(lat, lon);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function set(lat, lon, value, ttl = DEFAULT_TTL_MS) {
  const key = makeKey(lat, lon);
  cache.set(key, { value, expires: Date.now() + ttl });
}

function clear() {
  cache.clear();
}

module.exports = { get, set, clear, DEFAULT_TTL_MS };
