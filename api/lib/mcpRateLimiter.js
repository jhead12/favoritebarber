// Minimal MCP rate limiter (in-memory token bucket).
// For production use, swap to a centralized store (Redis) per deployment requirements.

const buckets = new Map();
const { getClient } = require('./redisClient');
const { logger } = require('./logger');

// Redis-backed combined Yelp quota helper key prefix
const YELP_QUOTA_KEY_PREFIX = process.env.YELP_QUOTA_KEY_PREFIX || 'yelp_quota';
const YELP_DAILY_QUOTA = Number(process.env.YELP_DAILY_QUOTA || 5000);

function defaultLimits(perMinute) {
  const pm = Number(perMinute || process.env.MCP_RATE_LIMIT_PER_MINUTE || 60);
  return { capacity: pm, refillPerSec: pm / 60 };
}

function getBucket(key, perMinute) {
  if (!buckets.has(key)) {
    const limits = defaultLimits(perMinute);
    buckets.set(key, { tokens: limits.capacity, last: Date.now() / 1000, limits });
  } else if (perMinute) {
    // ensure bucket respects updated per-minute limit
    const existing = buckets.get(key);
    if (existing.limits.capacity !== perMinute) {
      existing.limits = defaultLimits(perMinute);
      existing.tokens = Math.min(existing.tokens, existing.limits.capacity);
    }
  }
  return buckets.get(key);
}

function consumeToken(key, perMinute) {
  const now = Date.now() / 1000;
  const b = getBucket(key, perMinute);
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
  const perMinute = (req.mcp && req.mcp.rate_limit_per_minute) || Number(process.env.MCP_RATE_LIMIT_PER_MINUTE || 60);
  const r = consumeToken(partnerKey, perMinute);
  const limitVal = getBucket(partnerKey, perMinute).limits.capacity;
  if (typeof res.set === 'function') {
    res.set('X-RateLimit-Limit', String(limitVal));
    res.set('X-RateLimit-Remaining', String(r.ok ? r.remaining : 0));
  } else if (typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', String(limitVal));
    res.setHeader('X-RateLimit-Remaining', String(r.ok ? r.remaining : 0));
  }
  if (!r.ok) {
    if (typeof res.set === 'function') {
      res.set('Retry-After', String(r.retryAfterSec));
    } else if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(r.retryAfterSec));
    }
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

// Compatibility helpers expected by unit tests
async function checkRateLimit(partner) {
  const key = `partner:${partner.id}`;
  const perMinute = partner.rate_limit_per_minute || Number(process.env.MCP_RATE_LIMIT_PER_MINUTE || 60);
  const r = consumeToken(key, perMinute);
  const minuteRemaining = r.ok ? r.remaining : 0;

  const client = getClient();
  let dayRemaining = null;
  let dayAllowed = true;
  let dayRetryAfter = 0;

  // If a daily quota is set and Redis is available, enforce it atomically
  if (client && Number.isInteger(partner.quota_per_day)) {
    const dateKey = `mcp:quota:day:${partner.id}:${new Date().toISOString().slice(0,10)}`;
    const ttlMs = msUntilMidnight();
    try {
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
      const res = await client.eval(script, 1, dateKey, 1, partner.quota_per_day, ttlMs);
      const ok = !!res[0];
      const used = Number(res[1] || 0);
      dayRemaining = Math.max(0, partner.quota_per_day - used);
      dayAllowed = ok;
      if (!ok) {
        // retry after until midnight
        dayRetryAfter = Math.ceil(ttlMs / 1000);
      }
    } catch (e) {
      console.warn('checkRateLimit redis error', e);
      // Fail-open on Redis error: don't block by day quota
      dayRemaining = null;
      dayAllowed = true;
    }
  }

  const allowed = r.ok && dayAllowed;
  const retryAfter = !r.ok ? (r.retryAfterSec || 0) : (!dayAllowed ? dayRetryAfter : 0);
  return { allowed, minuteRemaining, dayRemaining, retryAfter };
}

async function rateLimitMiddleware(req, res, next) {
  // Use the compatibility middleware but enrich headers
  const partner = (req && req.mcp_partner) || req.mcp_partner || (req && req.mcp) || {};
  const status = await checkRateLimit(partner);
  // Log rate limit decision for debugging E2E failures
  try {
    logger.info({ partner_id: partner && partner.id, allowed: status.allowed, minuteRemaining: status.minuteRemaining, dayRemaining: status.dayRemaining }, 'mcpRateLimit status');
  } catch (e) {
    // ignore
  }
  const limit = (partner && partner.rate_limit_per_minute) || Number(process.env.MCP_RATE_LIMIT_PER_MINUTE || 60);
  const quota = (partner && partner.quota_per_day) || null;

  if (typeof res.set === 'function') {
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(status.minuteRemaining != null ? status.minuteRemaining : 0));
    res.set('X-RateLimit-Reset', String(60));
    res.set('X-RateLimit-Quota-Day', String(quota != null ? quota : 'unlimited'));
    res.set('X-RateLimit-Quota-Remaining', String(status.dayRemaining != null ? status.dayRemaining : 'unlimited'));
  } else if (typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(status.minuteRemaining != null ? status.minuteRemaining : 0));
    res.setHeader('X-RateLimit-Reset', String(60));
    res.setHeader('X-RateLimit-Quota-Day', String(quota != null ? quota : 'unlimited'));
    res.setHeader('X-RateLimit-Quota-Remaining', String(status.dayRemaining != null ? status.dayRemaining : 'unlimited'));
  }

  if (!status.allowed) {
    if (typeof res.set === 'function') {
      res.set('Retry-After', String(status.retryAfter || 0));
    } else if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(status.retryAfter || 0));
    }
    return res.status(429).json({ error: 'Rate limit exceeded', retry_after: status.retryAfter });
  }

  return next();
}

async function getRateLimitStatus(partner) {
  const key = `partner:${partner.id}`;
  const b = getBucket(key);
  const used = b.limits.capacity - Math.floor(b.tokens);
  return { minuteUsed: used, minuteRemaining: Math.floor(b.tokens), dayUsed: null, dayRemaining: null };
}

async function resetRateLimit(partnerId, scope = 'all') {
  const key = `partner:${partnerId}`;
  if (scope === 'minute' || scope === 'all') {
    buckets.delete(key);
  }
  // Reset day counters in Redis if available
  const client = getClient();
  if ((scope === 'day' || scope === 'all') && client) {
    const dateKey = `mcp:quota:day:${partnerId}:${new Date().toISOString().slice(0,10)}`;
    try {
      await client.del(dateKey);
    } catch (e) {
      console.warn('resetRateLimit redis error', e);
    }
  }
  return true;
}

module.exports = { rateLimitMiddleware, checkRateLimit, getRateLimitStatus, resetRateLimit, acquireYelpToken, getYelpUsage,
  // alias expected by index.js
  mcpRateLimitMiddleware: rateLimitMiddleware
};
