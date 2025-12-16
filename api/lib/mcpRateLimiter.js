// Minimal MCP rate limiter (in-memory token bucket).
// For production use, swap to a centralized store (Redis) per deployment requirements.

const buckets = new Map();

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

module.exports = { mcpRateLimitMiddleware };
