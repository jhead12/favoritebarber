#!/usr/bin/env node
// Yelp fetcher implementation (Node)
// Responsibilities:
// - Fetch businesses by area or location string
// - Fetch business details (photos) and reviews
// - Persist data into Postgres tables: barbers, locations, images, reviews, raw_snapshots
// - Enqueue image processing jobs (TODO: integrate with queue)

const fetch = global.fetch || require('node-fetch');
const { pool } = require('../../api/db');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  if (process.env.YELP_API_KEY) return;
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) {
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
}

async function yelpApi(path) {
  loadEnv();
  const key = process.env.YELP_API_KEY;
  if (!key) throw new Error('YELP_API_KEY not set in env. Get your key from https://www.yelp.com/developers');
  const res = await fetch(`https://api.yelp.com/v3${path}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Yelp API ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

async function upsertBarber(business) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT id FROM barbers WHERE yelp_business_id = $1', [business.id]);
    let barberId;
    const metadata = {
      raw: business
    };
    if (res.rows.length > 0) {
      barberId = res.rows[0].id;
      await client.query('UPDATE barbers SET name=$1, metadata=$2, updated_at=now() WHERE id=$3', [business.name, metadata, barberId]);
    } else {
      const insert = await client.query('INSERT INTO barbers (name, yelp_business_id, metadata) VALUES ($1,$2,$3) RETURNING id', [business.name, business.id, metadata]);
      barberId = insert.rows[0].id;
    }
    await client.query('COMMIT');
    return barberId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function upsertShop(business) {
  // upsert into shops table using yelp_business_id
  const res = await pool.query('SELECT id FROM shops WHERE yelp_business_id=$1', [business.id]);
  const metadata = { raw: business };
  if (res.rows.length > 0) {
    const id = res.rows[0].id;
    await pool.query('UPDATE shops SET name=$1, metadata=$2, updated_at=now() WHERE id=$3', [business.name, metadata, id]);
    return id;
  }
  const insert = await pool.query('INSERT INTO shops (name, yelp_business_id, metadata, created_at, updated_at) VALUES ($1,$2,$3,now(),now()) RETURNING id', [business.name, business.id, metadata]);
  return insert.rows[0].id;
}

async function upsertLocation(barberId, business, shopId=null) {
  const loc = business.location || {};
  const formatted = (loc.display_address || []).join(', ');
  const res = await pool.query('SELECT id FROM locations WHERE source=$1 AND source_id=$2', ['yelp', business.id]);
  if (res.rows.length > 0) return res.rows[0].id;
  const insert = await pool.query(
    'INSERT INTO locations (barber_id, shop_id, source, source_id, street, city, region, postal_code, country, formatted_address, latitude, longitude, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now()) RETURNING id',
    [barberId, shopId, 'yelp', business.id, loc.address1 || null, loc.city || null, loc.state || loc.region || null, loc.zip_code || loc.postal_code || null, loc.country || null, formatted || null, business.coordinates && business.coordinates.latitude || null, business.coordinates && business.coordinates.longitude || null]
  );
  return insert.rows[0].id;
}

async function upsertImages(barberId, business, shopId=null) {
  const photos = business.photos || [];
  console.log(`  Found ${photos.length} photos for ${business.name}`);
  for (const url of photos) {
    const res = await pool.query('SELECT id FROM images WHERE barber_id=$1 AND url=$2', [barberId, url]);
    if (res.rows.length > 0) {
      console.log(`    Image already exists: ${url.substring(0, 50)}...`);
      continue;
    }
    const insertRes = await pool.query('INSERT INTO images (barber_id, shop_id, source, source_id, url, fetched_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING id', [barberId, shopId, 'yelp', business.id, url]);
    console.log(`    ✓ Saved image ${insertRes.rows[0].id}: ${url.substring(0, 50)}...`);
    // TODO: enqueue image processing job here (push to Redis/Bull)
  }
}

async function upsertReviews(barberId, businessId, reviews, shopId=null) {
  for (let i = 0; i < (reviews || []).length; i++) {
    const r = reviews[i];
    const sourceId = r.id || `${businessId}-${i}`;
    const existing = await pool.query('SELECT id FROM reviews WHERE source=$1 AND source_id=$2', ['yelp', sourceId]);
    if (existing.rows.length > 0) continue;
    await pool.query('INSERT INTO reviews (barber_id, shop_id, source, source_id, user_display, text, rating, sentiment_score, created_at, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [barberId, shopId, 'yelp', sourceId, (r.user && r.user.name) || null, r.text || null, r.rating || null, null, r.time_created || null, r]);
  }
}

async function fetchBusinessDetailsAndPersist(business) {
  console.log('\nFetching details for:', business.name);
  try {
    const businessDetails = await yelpApi(`/businesses/${business.id}`);
    const reviewsResp = await yelpApi(`/businesses/${business.id}/reviews`);
    
    // create shop record for the business and persist related rows with shop_id
    const shopId = await upsertShop(businessDetails);
    const barberId = await upsertBarber(businessDetails);
    await upsertLocation(barberId, businessDetails, shopId);
    await upsertImages(barberId, businessDetails, shopId);
    await upsertReviews(barberId, business.id, reviewsResp.reviews || [], shopId);
    
    console.log('✓ Persisted business', business.id, 'as barberId', barberId, 'shopId', shopId);
  } catch (err) {
    console.error('✗ Error persisting business', business.id, err.message || err);
  }
}

async function fetchBusinessesByLocation(locationString, limit = 5) {
  console.log('='.repeat(70));
  console.log('FETCHING BARBERS FROM YELP');
  console.log('='.repeat(70));
  console.log('Location:', locationString);
  console.log('Limit:', limit);
  console.log();
  
  const search = await yelpApi(`/businesses/search?term=barbers&location=${encodeURIComponent(locationString)}&limit=${limit}`);
  const businesses = search.businesses || [];
  
  console.log(`Found ${businesses.length} barber businesses\n`);
  
  for (const b of businesses) {
    await fetchBusinessDetailsAndPersist(b);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✓ COMPLETED YELP FETCH');
  console.log('='.repeat(70));
  console.log('\nNext steps:');
  console.log('1. Process images: node workers/image_processor.js --pending 50');
  console.log('2. View results: node workers/test_e2e_hairstyle_workflow.js --dry-run');
  console.log();
}

module.exports = { fetchBusinessesByLocation, fetchBusinessDetailsAndPersist };

// CLI
if (require.main === module) {
  const loc = process.argv[2] || 'San Francisco, CA';
  const limit = parseInt(process.argv[3]) || 5;
  
  fetchBusinessesByLocation(loc, limit)
    .then(() => process.exit(0))
    .catch(err => { 
      console.error('\n✗ Error:', err.message);
      if (err.message.includes('YELP_API_KEY')) {
        console.error('\nTo get a Yelp API key:');
        console.error('1. Go to https://www.yelp.com/developers');
        console.error('2. Create an app');
        console.error('3. Copy your API key');
        console.error('4. Set it: export YELP_API_KEY=your_key_here');
        console.error('   Or add it to .env file');
      }
      process.exit(1);
    });
}
