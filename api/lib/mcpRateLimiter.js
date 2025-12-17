// Minimal MCP rate limiter (in-memory token bucket).
// For production use, swap to a centralized store (Redis) per deployment requirements.

const buckets = new Map();
const { getClient } = require('./redisClient');

// Redis-backed combined Yelp quota helper key prefix
const YELP_QUOTA_KEY_PREFIX = process.env.YELP_QUOTA_KEY_PREFIX || 'yelp_quota';
const YELP_DAILY_QUOTA = Number(process.env.YELP_DAILY_QUOTA || 5000);

function defaultLimits() {
  const perMinute = Number(process.env.MCP_RATE_LIMIT_PER_MINUTE || 60);
  return { capacity: perMinute, refillPerSec: perMinute / 60 };
}

function getBucket(key) {
  if (!buckets.has(key)) {
    const limits = defaultLimits();
    buckets.set(key, { tokens: limits.capacity, last: Date.now() / 1000, limits });
  }
  return buckets.get(key);
}

function consumeToken(key) {
  const now = Date.now() / 1000;
  const b = getBucket(key);
  const elapsed = Math.max(0, now - b.last);
  const refill = elapsed * b.limits.refillPerSec;
  b.tokens = Math.min(b.limits.capacity, b.tokens + refill);
  b.last = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { ok: true, remaining: Math.floor(b.tokens) };
  }
  return { ok: false, retryAfterSec: Math.ceil((1 - b.tokens) / b.limits.refillPerSec) };
}

function mcpRateLimitMiddleware(req, res, next) {
  const partnerKey = (req.mcp && req.mcp.apiKey) || req.ip || 'anon';
  const r = consumeToken(partnerKey);
  res.set('X-RateLimit-Limit', String(getBucket(partnerKey).limits.capacity));
  res.set('X-RateLimit-Remaining', String(r.ok ? r.remaining : 0));
  if (!r.ok) {
    res.set('Retry-After', String(r.retryAfterSec));
    return res.status(429).json({ error: 'rate_limited', retry_after: r.retryAfterSec });
  }
  next();
}

function msUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow - now;
}

function yelpKeyForDate(accountId = 'default') {
  const d = new Date();
  const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${YELP_QUOTA_KEY_PREFIX}:${accountId}:${day}`;
}

async function acquireYelpToken(opts = {}) {
  // opts: { accountId, cost }
  const accountId = opts.accountId || 'default';
  const cost = Number(opts.cost || 1);
  const quota = Number(process.env.YELP_DAILY_QUOTA || YELP_DAILY_QUOTA);

  const client = getClient();
  const key = yelpKeyForDate(accountId);
  const ttlMs = msUntilMidnight();

  if (!client) {
    // Fallback to in-memory minimal enforcement (approximate)
    const b = getBucket(`yelp_fallback:${accountId}`);
    // consume 'cost' tokens by calling consumeToken repeatedly (simple)
    for (let i = 0; i < cost; i++) {
      const r = consumeToken(`yelp_fallback:${accountId}`);
      if (!r.ok) return { ok: false, reason: 'no_redis_and_rate_limited', retryAfterSec: r.retryAfterSec };
    }
    return { ok: true, used: null, quota, remaining: null, ttlMs: null };
  }

  try {
    // Lua script: check then increment atomically and set expiry if needed
    const script = `
      local key = KEYS[1]
      local cost = tonumber(ARGV[1])
      local quota = tonumber(ARGV[2])
      local ttl = tonumber(ARGV[3])
      local cur = tonumber(redis.call('GET', key) or '0')
      if (cur + cost > quota) then
        return {0, cur}
      end
      local v = redis.call('INCRBY', key, cost)
      if (redis.call('PTTL', key) < 0) then
        redis.call('PEXPIRE', key, ttl)
      end
      return {1, v}
    `;

    const res = await client.eval(script, 1, key, cost, quota, ttlMs);
    // res => [okFlag (0/1), current]
    const ok = !!res[0];
    const used = Number(res[1] || 0);
    const remaining = Math.max(0, quota - used);
    return { ok, used, quota, remaining, ttlMs };
  } catch (e) {
    console.warn('acquireYelpToken redis error', e);
    return { ok: false, reason: 'redis_error', error: String(e) };
  }
}

async function getYelpUsage(accountId = 'default') {
  const client = getClient();
  const key = yelpKeyForDate(accountId);
  const quota = Number(process.env.YELP_DAILY_QUOTA || YELP_DAILY_QUOTA);
  if (!client) return { used: null, quota, remaining: null };
  try {
    const v = await client.get(key);
    const used = Number(v || 0);
    return { used, quota, remaining: Math.max(0, quota - used) };
  } catch (e) {
    console.warn('getYelpUsage redis error', e);
    return { used: null, quota, remaining: null, error: String(e) };
  }
}

module.exports = { mcpRateLimitMiddleware, acquireYelpToken, getYelpUsage };
