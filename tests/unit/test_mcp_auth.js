/**
 * MCP Authentication Middleware Tests
 * Tests for Bearer token validation, scope enforcement, key generation/revocation
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const {
  authenticateMCP,
  requireScope,
  generateAPIKey,
  revokeAPIKey
} = require('../../api/middleware/mcpAuth');

// Mock database pool
let pool;
let testPartnerId;
let testKeyId;
let testApiKey;

before(async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/favorite_barber_test'
  });

  // Create test partner
  const partnerResult = await pool.query(`
    INSERT INTO mcp_partners (name, email, tier, scopes, rate_limit_per_minute, quota_per_day, monthly_price_usd)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, ['Test Partner', 'test+unit@example.com', 'partner', JSON.stringify(['read:barbers', 'read:reviews']), 300, 50000, 299]);
  
  testPartnerId = partnerResult.rows[0].id;
});

after(async () => {
  // Clean up test data
  if (testKeyId) {
    await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [testKeyId]);
  }
  if (testPartnerId) {
    await pool.query('DELETE FROM mcp_partners WHERE id = $1', [testPartnerId]);
  }
  await pool.end();
});

describe('MCP Authentication', () => {
  describe('generateAPIKey', () => {
    it('should generate a valid API key', async () => {
      const result = await generateAPIKey(testPartnerId, 'test', 'Unit Test Key');
      
      assert.ok(result.key, 'API key should be generated');
      assert.ok(result.key.startsWith('ryb_test_'), 'Test key should have correct prefix');
      assert.ok(result.id, 'Key ID should be returned');
      
      testApiKey = result.key;
      testKeyId = result.id;
      
      // Verify key is stored in database with bcrypt hash
      const dbResult = await pool.query(
        'SELECT key_hash, key_prefix, status FROM mcp_api_keys WHERE id = $1',
        [testKeyId]
      );
      
      assert.strictEqual(dbResult.rows.length, 1, 'Key should exist in database');
      assert.ok(dbResult.rows[0].key_hash, 'Key hash should be stored');
      assert.strictEqual(dbResult.rows[0].status, 'active', 'Key should be active');
      
      // Verify bcrypt hash matches
      const isValid = await bcrypt.compare(testApiKey, dbResult.rows[0].key_hash);
      assert.ok(isValid, 'Stored hash should match generated key');
    });

    it('should generate live keys with correct prefix', async () => {
      const result = await generateAPIKey(testPartnerId, 'live', 'Live Key Test');
      
      assert.ok(result.key.startsWith('ryb_live_'), 'Live key should have correct prefix');
      
      // Clean up
      await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [result.id]);
    });
  });

  describe('authenticateMCP middleware', () => {
    it('should authenticate valid Bearer token', async () => {
      const req = {
        headers: { authorization: `Bearer ${testApiKey}` }
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            throw new Error(`Should not send error response: ${code} ${JSON.stringify(data)}`);
          }
        })
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await authenticateMCP(req, res, next);

      assert.ok(nextCalled, 'Next middleware should be called');
      assert.ok(req.mcp_partner, 'Partner context should be attached');
      assert.ok(req.mcp_api_key, 'API key context should be attached');
      assert.strictEqual(req.mcp_partner.id, testPartnerId, 'Correct partner should be loaded');
    });

    it('should reject missing Authorization header', async () => {
      const req = { headers: {} };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await authenticateMCP(req, res, next);

      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
      assert.ok(errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('Authorization'), 'Error should mention authorization');
    });

    it('should reject invalid Bearer token format', async () => {
      const req = {
        headers: { authorization: 'InvalidFormat' }
      };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await authenticateMCP(req, res, next);

      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
    });

    it('should reject non-existent API key', async () => {
      const req = {
        headers: { authorization: 'Bearer ryb_test_nonexistent123456' }
      };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await authenticateMCP(req, res, next);

      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
      assert.ok(errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('Invalid'), 'Error should mention invalid key');
    });

    it('should reject revoked API key', async () => {
      // Revoke the test key
      await revokeAPIKey(testKeyId, 'Testing revocation');

      const req = {
        headers: { authorization: `Bearer ${testApiKey}` }
      };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await authenticateMCP(req, res, next);

      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
      assert.ok(
        (errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('revoked')) ||
        (errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('Invalid')),
        'Error should mention revoked key'
      );

      // Re-generate key for subsequent tests
      const result = await generateAPIKey(testPartnerId, 'test', 'Unit Test Key Regenerated');
      testApiKey = result.key;
      testKeyId = result.id;
    });

    it('should reject expired API key', async () => {
      // Create an expired key
      const expiredResult = await pool.query(`
        INSERT INTO mcp_api_keys (partner_id, key_hash, key_prefix, environment, name, status, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        testPartnerId,
        await bcrypt.hash('ryb_test_expired123456', 10),
        'ryb_test_expired',
        'test',
        'Expired Key Test',
        'active',
        new Date(Date.now() - 86400000) // Yesterday
      ]);

      const req = {
        headers: { authorization: 'Bearer ryb_test_expired123456' }
      };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      await authenticateMCP(req, res, next);

      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
      assert.ok(errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('expired'), 'Error should mention expired key');

      // Clean up
      await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [expiredResult.rows[0].id]);
    });
  });

  describe('requireScope middleware', () => {
    it('should allow request with required scope', async () => {
      const req = {
        mcp_partner: {
          scopes: ['read:barbers', 'read:reviews']
        }
      };
      const res = {
        status: () => ({
          json: () => { throw new Error('Should not send error'); }
        })
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      requireScope('read:barbers')(req, res, next);

      assert.ok(nextCalled, 'Next middleware should be called');
    });

    it('should reject request without required scope', async () => {
      const req = {
        mcp_partner: {
          scopes: ['read:reviews']
        }
      };
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      requireScope('read:live_yelp')(req, res, next);

      assert.strictEqual(errorResponse.code, 403, 'Should return 403');
      assert.ok(errorResponse.data.error && errorResponse.data.error.message && errorResponse.data.error.message.includes('scope'), 'Error should mention scope');
    });

    it('should reject request with no partner context', async () => {
      const req = {};
      let errorResponse;
      const res = {
        status: (code) => ({
          json: (data) => {
            errorResponse = { code, data };
          }
        })
      };
      const next = () => { throw new Error('Next should not be called'); };

      requireScope('read:barbers')(req, res, next);

      // When no partner context is present we expect an authentication error (401)
      assert.strictEqual(errorResponse.code, 401, 'Should return 401');
    });
  });

  describe('revokeAPIKey', () => {
    it('should revoke API key successfully', async () => {
      // Create a new key to revoke
      const result = await generateAPIKey(testPartnerId, 'test', 'Key to Revoke');
      
      await revokeAPIKey(result.id, 'Test revocation');

      // Verify status in database
      const dbResult = await pool.query(
        'SELECT status, revoked_at, revoked_reason FROM mcp_api_keys WHERE id = $1',
        [result.id]
      );

      assert.strictEqual(dbResult.rows[0].status, 'revoked', 'Key should be revoked');
      assert.ok(dbResult.rows[0].revoked_at, 'Revoked timestamp should be set');
      assert.strictEqual(dbResult.rows[0].revoked_reason, 'Test revocation', 'Revocation reason should be stored');

      // Clean up
      await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [result.id]);
    });
  });
});

console.log('Run with: node --test tests/unit/test_mcp_auth.js');
