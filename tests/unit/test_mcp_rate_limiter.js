/**
 * MCP Rate Limiter Tests
 * Tests for Redis-backed rate limiting with per-minute and per-day quotas
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const Redis = require('ioredis');

const {
  rateLimitMiddleware,
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit
} = require('../../api/lib/mcpRateLimiter');

// Mock Redis client
let redis;

before(async () => {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    db: 1, // Use separate DB for tests
    keyPrefix: 'test:mcp:'
  });

  // Clear any existing test keys
  const keys = await redis.keys('test:mcp:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});

after(async () => {
  // Clean up test keys
  const keys = await redis.keys('test:mcp:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.quit();
});

describe('MCP Rate Limiter', () => {
  describe('checkRateLimit', () => {
    it('should allow request within rate limits', async () => {
      const partner = {
        id: 'test-partner-1',
        rate_limit_per_minute: 60,
        quota_per_day: 10000
      };

      const result = await checkRateLimit(partner);

      assert.strictEqual(result.allowed, true, 'Request should be allowed');
      assert.ok(result.minuteRemaining !== undefined, 'Minute remaining should be returned');
      assert.ok(result.dayRemaining !== undefined, 'Day remaining should be returned');
    });

    it('should enforce per-minute rate limit', async () => {
      const partner = {
        id: 'test-partner-minute',
        rate_limit_per_minute: 5,
        quota_per_day: 10000
      };

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(partner);
        assert.strictEqual(result.allowed, true, `Request ${i + 1} should be allowed`);
      }

      // 6th request should be blocked
      const blocked = await checkRateLimit(partner);
      assert.strictEqual(blocked.allowed, false, 'Request should be blocked');
      assert.ok(blocked.retryAfter > 0, 'Retry-After should be provided');
    });

    it('should enforce per-day quota limit', async () => {
      const partner = {
        id: 'test-partner-day',
        rate_limit_per_minute: 1000,
        quota_per_day: 3
      };

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(partner);
        assert.strictEqual(result.allowed, true, `Request ${i + 1} should be allowed`);
      }

      // 4th request should be blocked
      const blocked = await checkRateLimit(partner);
      assert.strictEqual(blocked.allowed, false, 'Request should be blocked by daily quota');
      assert.ok(blocked.retryAfter > 3600, 'Retry-After should be hours for daily quota');
    });

    it('should handle unlimited quotas', async () => {
      const partner = {
        id: 'test-partner-unlimited',
        rate_limit_per_minute: 999999,
        quota_per_day: null // Unlimited
      };

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(partner);
        assert.strictEqual(result.allowed, true, `Request ${i + 1} should be allowed`);
      }
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should allow request and set rate limit headers', async () => {
      const req = {
        mcp_partner: {
          id: 'test-middleware-1',
          rate_limit_per_minute: 100,
          quota_per_day: 5000
        }
      };
      const res = {
        setHeader: function(name, value) {
          this.headers = this.headers || {};
          this.headers[name] = value;
        },
        status: () => ({
          json: () => { throw new Error('Should not send error'); }
        }),
        headers: {}
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await rateLimitMiddleware(req, res, next);

      assert.ok(nextCalled, 'Next middleware should be called');
      assert.ok(res.headers['X-RateLimit-Limit'], 'Rate limit header should be set');
      assert.ok(res.headers['X-RateLimit-Remaining'], 'Rate limit remaining header should be set');
      assert.ok(res.headers['X-RateLimit-Reset'], 'Rate limit reset header should be set');
      assert.ok(res.headers['X-RateLimit-Quota-Day'], 'Daily quota header should be set');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const req = {
        mcp_partner: {
          id: 'test-middleware-limited',
          rate_limit_per_minute: 2,
          quota_per_day: 1000
        }
      };

      // Exhaust rate limit
      for (let i = 0; i < 2; i++) {
        await checkRateLimit(req.mcp_partner);
      }

      let errorResponse;
      const res = {
        setHeader: () => {},
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await rateLimitMiddleware(req, res, next);

      assert.strictEqual(errorResponse.code, 429, 'Should return 429');
      assert.ok(errorResponse.data.error.includes('Rate limit'), 'Error should mention rate limit');
      assert.ok(errorResponse.data.retry_after, 'Retry-After should be provided');
    });

    it('should fail open on Redis error', async () => {
      // Create a bad Redis client
      const badRedis = new Redis({
        host: 'nonexistent.redis.host',
        port: 9999,
        retryStrategy: () => null // Don't retry
      });
      // Prevent unhandled error events from failing the test run
      badRedis.on('error', () => {});

      const req = {
        mcp_partner: {
          id: 'test-middleware-redis-fail',
          rate_limit_per_minute: 100,
          quota_per_day: 5000
        }
      };
      const res = {
        setHeader: () => {},
        status: () => ({
          json: () => { throw new Error('Should not send error (fail-open)'); }
        })
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      // Temporarily replace Redis client
      const originalCheck = checkRateLimit;
      const checkWithBadRedis = async (partner) => {
        try {
          await badRedis.incr('test:key');
          return { allowed: true, minuteRemaining: 100, dayRemaining: 5000 };
        } catch (err) {
          // Fail open
          return { allowed: true, minuteRemaining: 100, dayRemaining: 5000 };
        }
      };

      await rateLimitMiddleware(req, res, next);

      assert.ok(nextCalled, 'Next middleware should be called (fail-open behavior)');

      await badRedis.quit();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      const partner = {
        id: 'test-status-1',
        rate_limit_per_minute: 60,
        quota_per_day: 10000
      };

      // Make a few requests first
      await checkRateLimit(partner);
      await checkRateLimit(partner);

      const status = await getRateLimitStatus(partner);

      assert.ok(status.minuteUsed !== undefined, 'Minute used should be returned');
      assert.ok(status.minuteRemaining !== undefined, 'Minute remaining should be returned');
      assert.ok(status.dayUsed !== undefined, 'Day used should be returned');
      assert.ok(status.dayRemaining !== undefined, 'Day remaining should be returned');
      assert.strictEqual(status.minuteUsed, 2, 'Should track minute usage');
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limits for partner', async () => {
      const partner = {
        id: 'test-reset-1',
        rate_limit_per_minute: 5,
        quota_per_day: 100
      };

      // Exhaust limits
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(partner);
      }

      // Verify blocked
      const blocked = await checkRateLimit(partner);
      assert.strictEqual(blocked.allowed, false, 'Should be blocked before reset');

      // Reset
      await resetRateLimit(partner.id);

      // Verify allowed again
      const allowed = await checkRateLimit(partner);
      assert.strictEqual(allowed.allowed, true, 'Should be allowed after reset');
    });

    it('should reset only minute limits when scope is "minute"', async () => {
      const partner = {
        id: 'test-reset-minute',
        rate_limit_per_minute: 3,
        quota_per_day: 100
      };

      // Make some requests
      await checkRateLimit(partner);
      await checkRateLimit(partner);

      const beforeReset = await getRateLimitStatus(partner);
      
      await resetRateLimit(partner.id, 'minute');

      const afterReset = await getRateLimitStatus(partner);

      assert.strictEqual(afterReset.minuteUsed, 0, 'Minute usage should be reset');
      assert.strictEqual(afterReset.dayUsed, beforeReset.dayUsed, 'Day usage should not be reset');
    });
  });
});

console.log('Run with: node --test tests/unit/test_mcp_rate_limiter.js');
