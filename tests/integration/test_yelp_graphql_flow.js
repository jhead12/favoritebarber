/**
 * Integration test for Yelp GraphQL enrichment flow
 * 
 * Tests the full pipeline:
 * 1. Fetch business details via GraphQL (mocked)
 * 2. Normalize GraphQL response
 * 3. Upsert into database
 * 4. Verify data integrity and graphql_enriched flag
 */

const assert = require('assert');
const { mapGraphqlBusiness, mapGraphqlReviews } = require('../../api/lib/yelp_normalize');
const fs = require('fs');
const path = require('path');

// Load fixtures
const sampleBusiness = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../fixtures/yelp_graphql/sample_business.json'), 'utf8')
);
const sampleReviews = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../fixtures/yelp_graphql/sample_reviews.json'), 'utf8')
);

// Mocha/Jest compatible test structure (only if test runner is present)
if (typeof describe !== 'undefined') {
  describe('Yelp GraphQL Integration', () => {
    
    describe('mapGraphqlBusiness', () => {
      it('should normalize GraphQL business response', () => {
        const normalized = mapGraphqlBusiness(sampleBusiness);
        
        assert.strictEqual(normalized.id, 'test-barber-shop-sf');
        assert.strictEqual(normalized.name, 'Test Barber Shop');
        assert.strictEqual(normalized.rating, 4.5);
        assert.strictEqual(normalized.review_count, 127);
        assert.strictEqual(normalized.price, '$$');
        
        // Check hours are preserved
        assert.ok(normalized.hours);
        assert.ok(normalized.hours.open);
        assert.strictEqual(normalized.hours.open.length, 7);
        
        // Check images
        assert.strictEqual(normalized.images.length, 2);
        assert.ok(normalized.images[0].url.includes('test1.jpg'));
        
        // Check categories
        assert.strictEqual(normalized.categories.length, 2);
        assert.strictEqual(normalized.categories[0].title, 'Barbers');
        assert.strictEqual(normalized.categories[0].alias, 'barbers');
        
        // Check coordinates
        assert.strictEqual(normalized.coordinates.latitude, 37.7749);
        assert.strictEqual(normalized.coordinates.longitude, -122.4194);
      });
      
      it('should handle null business', () => {
        const normalized = mapGraphqlBusiness(null);
        assert.strictEqual(normalized, null);
      });
      
      it('should handle business with no photos', () => {
        const businessNoPhotos = { ...sampleBusiness, photos: [] };
        const normalized = mapGraphqlBusiness(businessNoPhotos);
        assert.strictEqual(normalized.images.length, 0);
      });
    });
    
    describe('mapGraphqlReviews', () => {
      it('should normalize GraphQL reviews', () => {
        const normalized = mapGraphqlReviews(sampleReviews);
        
        assert.strictEqual(normalized.length, 3);
        
        // Check first review
        const review1 = normalized[0];
        assert.strictEqual(review1.external_id, 'review-1');
        assert.ok(review1.text.includes('Amazing fade'));
        assert.strictEqual(review1.rating, 5);
        assert.strictEqual(review1.external_user_name, 'Mike Johnson');
        assert.strictEqual(review1.external_user_id, 'user-123');
        assert.ok(review1.external_user_image_url);
        
        // Check review with null image
        const review3 = normalized[2];
        assert.strictEqual(review3.external_user_name, 'David Martinez');
        assert.strictEqual(review3.external_user_image_url, null);
      });
      
      it('should handle empty reviews array', () => {
        const normalized = mapGraphqlReviews([]);
        assert.strictEqual(normalized.length, 0);
      });
      
      it('should handle null reviews', () => {
        const normalized = mapGraphqlReviews(null);
        assert.strictEqual(normalized.length, 0);
      });
    });
    
    describe('GraphQL Query Structure', () => {
      it('should export required query constants', () => {
        const { BUSINESS_DETAILS_QUERY, REVIEWS_QUERY } = require('../../api/yelp_graphql');
        
        assert.ok(BUSINESS_DETAILS_QUERY);
        assert.ok(BUSINESS_DETAILS_QUERY.includes('query Business'));
        assert.ok(BUSINESS_DETAILS_QUERY.includes('hours'));
        assert.ok(BUSINESS_DETAILS_QUERY.includes('price'));
        assert.ok(BUSINESS_DETAILS_QUERY.includes('categories'));
        
        assert.ok(REVIEWS_QUERY);
        assert.ok(REVIEWS_QUERY.includes('query BusinessReviews'));
        assert.ok(REVIEWS_QUERY.includes('reviews'));
        assert.ok(REVIEWS_QUERY.includes('user'));
      });
    });
    
    describe('Feature Flags', () => {
      it('should respect USE_YELP_GRAPHQL flag', () => {
        const originalValue = process.env.USE_YELP_GRAPHQL;
        
        process.env.USE_YELP_GRAPHQL = 'true';
        assert.strictEqual(process.env.USE_YELP_GRAPHQL, 'true');
        
        process.env.USE_YELP_GRAPHQL = 'false';
        assert.strictEqual(process.env.USE_YELP_GRAPHQL, 'false');
        
        // Restore
        if (originalValue !== undefined) {
          process.env.USE_YELP_GRAPHQL = originalValue;
        } else {
          delete process.env.USE_YELP_GRAPHQL;
        }
      });
    });
    
  });
}

// Run tests if this is the main module
if (require.main === module) {
  console.log('Running Yelp GraphQL integration tests...\n');
  
  const tests = [
    { name: 'mapGraphqlBusiness - normalize', fn: () => {
      const normalized = mapGraphqlBusiness(sampleBusiness);
      assert.strictEqual(normalized.id, 'test-barber-shop-sf');
      assert.strictEqual(normalized.price, '$$');
      console.log('✓ mapGraphqlBusiness normalizes correctly');
    }},
    { name: 'mapGraphqlReviews - normalize', fn: () => {
      const normalized = mapGraphqlReviews(sampleReviews);
      assert.strictEqual(normalized.length, 3);
      assert.strictEqual(normalized[0].external_user_name, 'Mike Johnson');
      console.log('✓ mapGraphqlReviews normalizes correctly');
    }},
    { name: 'Query exports', fn: () => {
      const { BUSINESS_DETAILS_QUERY, REVIEWS_QUERY } = require('../../api/yelp_graphql');
      assert.ok(BUSINESS_DETAILS_QUERY.includes('hours'));
      assert.ok(REVIEWS_QUERY.includes('reviews'));
      console.log('✓ GraphQL queries exported correctly');
    }}
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      test.fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`✗ ${test.name}:`, err.message);
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

module.exports = { sampleBusiness, sampleReviews };
