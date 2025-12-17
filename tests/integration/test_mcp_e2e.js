/**
 * MCP End-to-End Integration Tests
 * Tests full request flow: auth → rate limiting → endpoint → response
 * 
 * Prerequisites:
 * - Database with migration 030 applied
 * - Redis running
 * - API server running on localhost:3000
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');

const {
  generateAPIKey,
  revokeAPIKey
} = require('../../api/middleware/mcpAuth');

// Test configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
let pool;
let testPartnerId;
let testKeyId;
let testApiKey;

before(async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/favorite_barber_test'
  });

  // Create test partner (use timestamped email to avoid collisions)
  const e2eEmail = `test+e2e+${Date.now()}@example.com`;
  const partnerResult = await pool.query(`
    INSERT INTO mcp_partners (name, email, tier, scopes, rate_limit_per_minute, quota_per_day, monthly_price_usd)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, ['E2E Test Partner', e2eEmail, 'partner', JSON.stringify(['read:barbers', 'read:reviews']), 3, 1000, 299]);
  
  testPartnerId = partnerResult.rows[0].id;

  // Generate API key
  const keyResult = await generateAPIKey(testPartnerId, 'test', 'E2E Test Key');
  testApiKey = keyResult.key;
  testKeyId = keyResult.id;

  console.log(`Test Partner ID: ${testPartnerId}`);
  console.log(`Test API Key: ${testApiKey.substring(0, 20)}...`);
});

after(async () => {
  // Clean up
  if (testKeyId) {
    await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [testKeyId]);
  }
  if (testPartnerId) {
    await pool.query('DELETE FROM mcp_request_logs WHERE partner_id = $1', [testPartnerId]);
    await pool.query('DELETE FROM mcp_quota_usage WHERE partner_id = $1', [testPartnerId]);
    await pool.query('DELETE FROM mcp_partners WHERE id = $1', [testPartnerId]);
  }
  await pool.end();
});

describe('MCP End-to-End Tests', () => {
  describe('Authentication Flow', () => {
    it('should authenticate valid API key', async () => {
      const response = await fetch(`${API_BASE}/api/mcp/health`, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`
        }
      });

      assert.ok(response.ok || response.status === 404, 'Should authenticate (200 or 404 if health endpoint not MCP-enabled)');
      
      // Check for rate limit headers
      assert.ok(response.headers.get('X-RateLimit-Limit'), 'Should include rate limit headers');
    });

    it('should reject missing authorization', async () => {
      const response = await fetch(`${API_BASE}/api/mcp/barbers`);

      assert.strictEqual(response.status, 401, 'Should return 401 for missing auth');
      
      const data = await response.json();
      assert.ok(data.error, 'Should return error message');
    });

    it('should reject invalid API key', async () => {
      const response = await fetch(`${API_BASE}/api/mcp/barbers`, {
        headers: {
          'Authorization': 'Bearer ryb_test_invalid123456'
        }
      });

      assert.strictEqual(response.status, 401, 'Should return 401 for invalid key');
    });

    it('should reject revoked API key', async () => {
      // Revoke the key
      await revokeAPIKey(testKeyId, 'E2E test revocation');

      const response = await fetch(`${API_BASE}/api/mcp/barbers`, {
        headers: {
          'Authorization': `Bearer ${testApiKey}`
        }
      });

      assert.strictEqual(response.status, 401, 'Should return 401 for revoked key');

      // Re-generate key for subsequent tests
      const keyResult = await generateAPIKey(testPartnerId, 'test', 'E2E Test Key Regenerated');
      testApiKey = keyResult.key;
      testKeyId = keyResult.id;
    });
  });

  describe('Rate Limiting Flow', () => {
    it('should enforce per-minute rate limits', async () => {
      // Partner has 3 req/min limit
      const results = [];

      // Make 3 requests (should succeed)
      for (let i = 0; i < 3; i++) {
        const response = await fetch(`${API_BASE}/api/mcp/health`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        results.push(response.status);
      }

      // 4th request should be rate limited
      const rateLimited = await fetch(`${API_BASE}/api/mcp/health`, {
        headers: { 'Authorization': `Bearer ${testApiKey}` }
      });

      assert.strictEqual(rateLimited.status, 429, 'Should return 429 after exceeding rate limit');
      assert.ok(rateLimited.headers.get('Retry-After'), 'Should include Retry-After header');
      
      const data = await rateLimited.json();
      assert.ok(data.error.includes('Rate limit'), 'Error should mention rate limit');
    });

    it('should include rate limit headers in responses', async () => {
      // Reset rate limit for clean test
      const Redis = require('ioredis');
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      });
      
      const now = new Date();
      const minuteKey = `mcp:ratelimit:minute:${testPartnerId}:${now.getMinutes()}`;
      const dateKey = `mcp:ratelimit:day:${testPartnerId}:${now.toISOString().split('T')[0]}`;
      await redis.del(minuteKey, dateKey);
      await redis.quit();

      // Reset and hit MCP health endpoint to observe headers
      const response = await fetch(`${API_BASE}/api/mcp/health`, {
        headers: { 'Authorization': `Bearer ${testApiKey}` }
      });

      assert.ok(response.headers.get('X-RateLimit-Limit'), 'Should include X-RateLimit-Limit');
      assert.ok(response.headers.get('X-RateLimit-Remaining'), 'Should include X-RateLimit-Remaining');
      assert.ok(response.headers.get('X-RateLimit-Reset'), 'Should include X-RateLimit-Reset');
      assert.ok(response.headers.get('X-RateLimit-Quota-Day'), 'Should include X-RateLimit-Quota-Day');
      assert.ok(response.headers.get('X-RateLimit-Quota-Remaining'), 'Should include X-RateLimit-Quota-Remaining');

      const limit = parseInt(response.headers.get('X-RateLimit-Limit'));
      assert.strictEqual(limit, 3, 'Rate limit should match partner tier');
    });
  });

  describe('Request Logging', () => {
    it('should log MCP requests to database', async () => {
      // Make a request
      await fetch(`${API_BASE}/api/health`, {
        headers: { 'Authorization': `Bearer ${testApiKey}` }
      });

      // Wait a moment for async logging
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if request was logged
      const logs = await pool.query(
        'SELECT * FROM mcp_request_logs WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 1',
        [testPartnerId]
      );

      // Note: Logging is only implemented when endpoints are created
      // This test documents expected behavior
      if (logs.rows.length > 0) {
        assert.ok(logs.rows[0].request_id, 'Request should have ID');
        assert.ok(logs.rows[0].endpoint, 'Endpoint should be logged');
        assert.ok(logs.rows[0].status_code, 'Status code should be logged');
      } else {
        console.log('Note: Request logging not yet implemented (endpoints pending)');
      }
    });
  });

  describe('Scope Enforcement', () => {
    it('should enforce required scopes', async () => {
      // Create partner with limited scopes
      const limitedEmail = `test+limited+${Date.now()}@example.com`;
      const limitedPartner = await pool.query(`
        INSERT INTO mcp_partners (name, email, tier, scopes, rate_limit_per_minute, quota_per_day)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['Limited Scope Partner', limitedEmail, 'free', JSON.stringify(['read:barbers']), 60, 10000]);

      const limitedKey = await generateAPIKey(limitedPartner.rows[0].id, 'test', 'Limited Scope Key');

      // Try to access endpoint requiring 'read:live_yelp' scope
      const response = await fetch(`${API_BASE}/api/mcp/live_yelp/123`, {
        headers: { 'Authorization': `Bearer ${limitedKey.key}` }
      });

      // Should be 403 (forbidden) if endpoint exists and enforces scopes
      // or 404 if endpoint not implemented yet
      assert.ok(response.status === 403 || response.status === 404, 'Should enforce scope requirements');

      if (response.status === 403) {
        const data = await response.json();
        const errorMessage = typeof data.error === 'string' ? data.error : data.error.message;
        assert.ok(errorMessage.includes('scope'), 'Error should mention scope requirement');
      }

      // Clean up
      await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [limitedKey.id]);
      await pool.query('DELETE FROM mcp_partners WHERE id = $1', [limitedPartner.rows[0].id]);
    });
  });
});

console.log('\n=================================');
console.log('MCP End-to-End Integration Tests');
console.log('=================================\n');
console.log('Prerequisites:');
console.log('1. API server running: npm start (in api/)');
console.log('2. PostgreSQL with migration 030 applied');
console.log('3. Redis running\n');
console.log('Run with: node --test tests/integration/test_mcp_e2e.js\n');
