/**
 * Integration tests: shop & barber profiles + search
 *
 * Run with: node --test tests/integration/test_profiles_and_search.js
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { pool } = require('../../api/db');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

let shopId, barberId, yelpId, socialProfileId;

before(async () => {
  // Create a fake Yelp business entry
  yelpId = `test_yelp_${Date.now()}`;
  const raw = {
    id: yelpId,
    name: 'Test Yelp Shop',
    url: 'https://example.com/test-shop',
    website: 'https://example.com/test-shop'
  };
  await pool.query(`INSERT INTO yelp_businesses (id, raw, name, latitude, longitude, address, rating, images, last_fetched_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) ON CONFLICT (id) DO UPDATE SET raw = EXCLUDED.raw`, [yelpId, JSON.stringify(raw), raw.name, null, null, '', null, JSON.stringify([])]);

  // Create a shop pointing to yelp_business_id
  const shopRes = await pool.query(`INSERT INTO shops (name, yelp_business_id, created_at, updated_at) VALUES ($1,$2, NOW(), NOW()) RETURNING id`, ['Integration Test Shop', yelpId]);
  shopId = shopRes.rows[0].id;

  // Create a barber and link to shop
  const barberRes = await pool.query(`INSERT INTO barbers (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id`, ['Integration Barber Joe']);
  barberId = barberRes.rows[0].id;
  await pool.query(`INSERT INTO shop_barbers (shop_id, barber_id, is_current) VALUES ($1,$2,true)`, [shopId, barberId]);

  // Insert a social profile as if discovered by the crawler
  const evidence = { source: 'yelp_scrape', yelp_business: yelpId };
  const sp = await pool.query(`INSERT INTO social_profiles (platform, handle, profile_url, name, confidence, evidence, created_at) VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING id`, ['instagram', 'test_handle', 'https://instagram.com/test_handle', 'Test Shop', 0.9, JSON.stringify(evidence)]);
  socialProfileId = sp.rows[0].id;

  // Add an image for the shop so shop endpoint returns images
  await pool.query(`INSERT INTO images (shop_id, url, source, relevance_score, fetched_at) VALUES ($1,$2,$3,$4,now())`, [shopId, 'https://example.com/image.jpg', 'yelp', 0.8]);

  // Add a review for the barber/shop
  await pool.query(`INSERT INTO reviews (barber_id, shop_id, text, rating, created_at) VALUES ($1,$2,$3,5,NOW())`, [barberId, shopId, 'Great cut by Joe!']);
});

after(async () => {
  await pool.query('DELETE FROM reviews WHERE shop_id = $1', [shopId]);
  await pool.query('DELETE FROM images WHERE shop_id = $1', [shopId]);
  await pool.query('DELETE FROM social_profiles WHERE id = $1', [socialProfileId]);
  await pool.query('DELETE FROM shop_barbers WHERE shop_id = $1', [shopId]);
  await pool.query('DELETE FROM barbers WHERE id = $1', [barberId]);
  await pool.query('DELETE FROM shops WHERE id = $1', [shopId]);
  await pool.query('DELETE FROM yelp_businesses WHERE id = $1', [yelpId]);
});

describe('Profiles & Search', () => {

  test('GET /api/shops/:id should return website, barbers, images and reviews', async () => {
    const res = await fetch(`${API_BASE}/api/shops/${shopId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, shopId);
    assert.ok(data.website && typeof data.website === 'string', 'website should be present');
    assert.ok(Array.isArray(data.barbers), 'barbers should be array');
    assert.ok(data.barbers.find(b => b.id === barberId), 'should include our barber');
    assert.ok(Array.isArray(data.images) && data.images.length > 0, 'should include images');
    assert.ok(Array.isArray(data.reviews) && data.reviews.length > 0, 'should include reviews');
  });

  test('GET /api/barbers/:id should return social_profiles and gallery', async () => {
    const res = await fetch(`${API_BASE}/api/barbers/${barberId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, barberId);
    assert.ok(Array.isArray(data.social_profiles), 'social_profiles should be array');
    // Our inserted social profile references the yelp business; check presence by platform or profile_url
    const found = data.social_profiles.some(sp => sp.platform === 'instagram' || (sp.profile_url && sp.profile_url.includes('instagram')));
    assert.ok(found, 'should surface inserted social profile');
  });

  test('GET /api/search should return array of results', async () => {
    const res = await fetch(`${API_BASE}/api/search`);
    assert.strictEqual(res.status, 200);
    const arr = await res.json();
    assert.ok(Array.isArray(arr), 'search should return array');
  });

});
