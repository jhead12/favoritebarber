/**
 * MCP LLM Integration Tests
 * 
 * Tests the /api/mcp/enrich/reviews endpoint which uses LLM to:
 * - Extract barber names from reviews
 * - Analyze sentiment scores
 * - Generate review summaries
 * 
 * Prerequisites:
 * 1. API server running on port 3000
 * 2. PostgreSQL with test data
 * 3. LLM provider configured (defaults to mock for testing)
 * 
 * Run with: node --test tests/integration/test_mcp_llm.js
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { pool } = require('../../api/db');
const { generateAPIKey } = require('../../api/middleware/mcpAuth');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
let testPartnerId, testApiKey, testShopId, testBarberId, testReviewId;

console.log('\n=================================');
console.log('MCP LLM Integration Tests');
console.log('=================================\n');
console.log('Prerequisites:');
console.log('1. API server running: npm start (in api/)');
console.log('2. PostgreSQL with test data');
console.log('3. LLM_PROVIDER=mock (or other configured provider)\n');
console.log('Run with: node --test tests/integration/test_mcp_llm.js\n');

// Setup test data
before(async () => {
  // Create test partner with API key
  const partnerRes = await pool.query(`
    INSERT INTO mcp_partners (name, email, scopes, status, created_at, updated_at)
    VALUES ('LLM Test Partner', 'llm-test@example.com', 
            '["read:barbers", "read:reviews", "write:discover"]'::jsonb, 
            'active', NOW(), NOW())
    RETURNING id
  `);
  testPartnerId = partnerRes.rows[0].id;

  const keyData = await generateAPIKey(testPartnerId, 'test', 'LLM integration test key');
  testApiKey = keyData.key;
  
  console.log(`Test Partner ID: ${testPartnerId}`);
  console.log(`Test API Key: ${testApiKey.slice(0, 23)}...\n`);

  // Create test shop
  const shopRes = await pool.query(`
    INSERT INTO shops (name, created_at, updated_at)
    VALUES ('Test Barbershop', NOW(), NOW())
    RETURNING id
  `);
  testShopId = shopRes.rows[0].id;

  // Create test barber
  const barberRes = await pool.query(`
    INSERT INTO barbers (name, created_at, updated_at)
    VALUES ('Test Barber Mike', NOW(), NOW())
    RETURNING id
  `);
  testBarberId = barberRes.rows[0].id;

  // Link barber to shop
  await pool.query(`
    INSERT INTO shop_barbers (shop_id, barber_id, is_current)
    VALUES ($1, $2, true)
  `, [testShopId, testBarberId]);

  // Create test review with text for LLM enrichment
  const reviewRes = await pool.query(`
    INSERT INTO reviews (barber_id, text, rating, created_at)
    VALUES ($1, $2, 5, NOW())
    RETURNING id
  `, [
    testBarberId, 
    'Mike gave me an amazing fade! Best haircut I ever had. The shop was clean and professional. Highly recommend Mike for fades and tapers.'
  ]);
  testReviewId = reviewRes.rows[0].id;

  // Create another review with sentiment variety
  await pool.query(`
    INSERT INTO reviews (barber_id, text, rating, created_at)
    VALUES ($1, $2, 3, NOW())
  `, [
    testBarberId,
    'Carlos did an okay job but I had to wait 45 minutes. The cut was decent but not great.'
  ]);
});

// Cleanup test data
after(async () => {
  if (testReviewId) {
    await pool.query('DELETE FROM reviews WHERE barber_id = $1', [testBarberId]);
  }
  if (testBarberId) {
    await pool.query('DELETE FROM shop_barbers WHERE barber_id = $1', [testBarberId]);
    await pool.query('DELETE FROM barbers WHERE id = $1', [testBarberId]);
  }
  if (testShopId) {
    await pool.query('DELETE FROM shops WHERE id = $1', [testShopId]);
  }
  if (testPartnerId) {
    await pool.query('DELETE FROM mcp_api_keys WHERE partner_id = $1', [testPartnerId]);
    await pool.query('DELETE FROM mcp_partners WHERE id = $1', [testPartnerId]);
  }
});

describe('MCP LLM Integration', () => {

  describe('GET /api/mcp/enrich/reviews', () => {
    
    test('should enrich reviews by barber_id', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?barber_id=${testBarberId}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      
      const data = await response.json();
      
      // Verify response structure
      assert.ok(data.count >= 0, 'Should have count field');
      assert.ok(Array.isArray(data.results), 'Should have results array');
      
      if (data.results.length > 0) {
        const result = data.results[0];
        
        // Verify enrichment fields
        assert.ok('review_id' in result, 'Should have review_id');
        assert.ok('barber_id' in result, 'Should have barber_id');
        assert.ok('names' in result, 'Should have extracted names');
        assert.ok('sentiment' in result, 'Should have sentiment score');
        assert.ok('summary' in result, 'Should have summary');
        
        // Verify data types
        assert.ok(typeof result.review_id === 'number', 'review_id should be number');
        assert.ok(Array.isArray(result.names) || result.names === null, 'names should be array or null');
        assert.ok(typeof result.sentiment === 'number', 'sentiment should be number');
        assert.ok(typeof result.summary === 'string', 'summary should be string');
        
        console.log('\n📊 Sample Enrichment Result:');
        console.log(`   Review ID: ${result.review_id}`);
        console.log(`   Names Extracted: ${JSON.stringify(result.names)}`);
        console.log(`   Sentiment Score: ${result.sentiment}`);
        console.log(`   Summary: ${result.summary.slice(0, 80)}...`);
      }
    });

    test('should enrich reviews by shop_id', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?shop_id=${testShopId}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 200, 'Should return 200 OK');
      
      const data = await response.json();
      assert.ok(data.count >= 0, 'Should have count field');
      assert.ok(Array.isArray(data.results), 'Should have results array');
      
      // All results should be for barbers at this shop
      for (const result of data.results) {
        assert.strictEqual(result.barber_id, testBarberId, 'Should only return reviews for barbers at shop');
      }
    });

    test('should persist enrichment to database', async () => {
      // Call enrichment endpoint
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?barber_id=${testBarberId}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      
      if (data.results.length > 0) {
        const enrichedReviewId = data.results[0].review_id;
        
        // Query database to verify enrichment was persisted
        const dbCheck = await pool.query(
          'SELECT extracted_names, review_summary, enriched_at FROM reviews WHERE id = $1',
          [enrichedReviewId]
        );
        
        assert.ok(dbCheck.rows.length > 0, 'Review should exist in database');
        const dbRow = dbCheck.rows[0];
        
        // Verify fields were updated
        assert.ok(dbRow.enriched_at !== null, 'enriched_at should be set');
        // extracted_names and review_summary may be null if LLM failed, but enriched_at should always be set
        
        console.log('\n💾 Database Persistence Check:');
        console.log(`   Review ID: ${enrichedReviewId}`);
        console.log(`   Extracted Names: ${dbRow.extracted_names || 'null'}`);
        console.log(`   Summary: ${dbRow.review_summary ? dbRow.review_summary.slice(0, 60) + '...' : 'null'}`);
        console.log(`   Enriched At: ${dbRow.enriched_at}`);
      }
    });

    test('should respect limit parameter', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?barber_id=${testBarberId}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      
      assert.ok(data.results.length <= 1, 'Should respect limit=1');
    });

    test('should require authentication', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?barber_id=${testBarberId}`
      );

      assert.strictEqual(response.status, 401, 'Should require authentication');
    });

    test('should reject missing parameters', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 400, 'Should reject missing barber_id/shop_id');
      
      const data = await response.json();
      assert.ok(data.error === 'missing_barber_or_shop_id', 'Should return appropriate error');
    });

    test('should handle non-existent barber', async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/enrich/reviews?barber_id=999999`,
        {
          headers: {
            'Authorization': `Bearer ${testApiKey}`
          }
        }
      );

      assert.strictEqual(response.status, 200, 'Should return 200 even for non-existent barber');
      
      const data = await response.json();
      assert.strictEqual(data.count, 0, 'Should return empty results');
      assert.strictEqual(data.results.length, 0, 'Results array should be empty');
    });

    test('should handle shop with no barbers', async () => {
      // Create shop with no barbers
      const emptyShopRes = await pool.query(`
        INSERT INTO shops (name, created_at, updated_at)
        VALUES ('Empty Shop', NOW(), NOW())
        RETURNING id
      `);
      const emptyShopId = emptyShopRes.rows[0].id;

      try {
        const response = await fetch(
          `${API_BASE}/api/mcp/enrich/reviews?shop_id=${emptyShopId}`,
          {
            headers: {
              'Authorization': `Bearer ${testApiKey}`
            }
          }
        );

        assert.strictEqual(response.status, 404, 'Should return 404 for shop with no barbers');
        
        const data = await response.json();
        assert.ok(data.error === 'no_barbers_found_for_shop', 'Should return appropriate error');
      } finally {
        await pool.query('DELETE FROM shops WHERE id = $1', [emptyShopId]);
      }
    });
  });

  describe('LLM Provider Configuration', () => {
    
    test('should use configured LLM provider', async () => {
      const provider = process.env.LLM_PROVIDER || 'mock';
      console.log(`\n🤖 Current LLM Provider: ${provider}`);
      console.log(`   Timeout: ${process.env.LLM_TIMEOUT_MS || 12000}ms`);
      console.log(`   Max Retries: ${process.env.LLM_MAX_RETRIES || 1}`);
      
      // This test just documents the current configuration
      assert.ok(true, 'Provider configuration documented');
    });
  });
});

console.log('\n');
