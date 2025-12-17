// Yelp fetcher implementation (Node)
// Responsibilities:
// - Fetch businesses by area or location string
// - Fetch business details (photos) and reviews
// - Persist data into Postgres tables: barbers, locations, images, reviews, raw_snapshots
// - Enqueue image processing jobs (TODO: integrate with queue)
// - (GraphQL) Enrich businesses with GraphQL for richer data (hours, price, reviews)

const fetch = global.fetch || require('node-fetch');
const { pool } = require('../../api/db');
const { fetchBusinessDetails, fetchBusinessReviews } = require('../../api/yelp_graphql');
const { mapGraphqlBusiness, mapGraphqlReviews } = require('../../api/lib/yelp_normalize');
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
  if (!key) throw new Error('YELP_API_KEY not set in env');
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
  for (const url of photos) {
    const res = await pool.query('SELECT id FROM images WHERE barber_id=$1 AND url=$2', [barberId, url]);
    if (res.rows.length > 0) continue;
    await pool.query('INSERT INTO images (barber_id, shop_id, source, source_id, url, fetched_at) VALUES ($1,$2,$3,$4,$5,now())', [barberId, shopId, 'yelp', business.id, url]);
    // TODO: enqueue image processing job here (push to Redis/Bull)
  }
}

async function upsertReviews(barberId, businessId, reviews, shopId=null) {
  for (let i = 0; i < (reviews || []).length; i++) {
    const r = reviews[i];
    const sourceId = r.id || `${businessId}-${i}`;
    const existing = await pool.query('SELECT id FROM reviews WHERE source=$1 AND source_id=$2', ['yelp', sourceId]);
    if (existing.rows.length > 0) continue;
    // Ensure we persist a created_at timestamp; fallback to now() if the source doesn't provide one
    const createdAt = r.time_created || new Date().toISOString();
    await pool.query('INSERT INTO reviews (barber_id, shop_id, source, source_id, user_display, text, rating, sentiment_score, created_at, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [barberId, shopId, 'yelp', sourceId, (r.user && r.user.name) || null, r.text || null, r.rating || null, null, createdAt, r]);
  }
}

async function fetchBusinessDetailsAndPersist(business) {
  console.log('Persisting business', business.id, business.name);
  try {
    const useGraphql = process.env.USE_YELP_GRAPHQL === 'true';
    
    if (useGraphql) {
      await enrichBusinessWithGraphql(business.id);
    } else {
      // Legacy REST-based enrichment
      const businessDetails = await yelpApi(`/businesses/${business.id}`);
      const reviewsResp = await yelpApi(`/businesses/${business.id}/reviews`);
      const shopId = await upsertShop(businessDetails);
      const barberId = await upsertBarber(businessDetails);
      await upsertLocation(barberId, businessDetails, shopId);
      await upsertImages(barberId, businessDetails, shopId);
      await upsertReviews(barberId, business.id, reviewsResp.reviews || [], shopId);
      console.log('Persisted business', business.id, 'as barberId', barberId);
    }
  } catch (err) {
    console.error('Error persisting business', business.id, err.message || err);
  }
}

/**
 * Enrich a business using GraphQL (fetches details, reviews, and persists)
 * @param {string} yelpId - Yelp business ID
 */
async function enrichBusinessWithGraphql(yelpId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if already enriched (unless force re-enrich is enabled)
    const forceReenrich = process.env.FORCE_YELP_REENRICH === 'true';
    if (!forceReenrich) {
      const check = await client.query(
        'SELECT graphql_enriched FROM yelp_businesses WHERE yelp_id = $1',
        [yelpId]
      );
      if (check.rows.length > 0 && check.rows[0].graphql_enriched) {
        console.log('Business', yelpId, 'already enriched via GraphQL, skipping');
        await client.query('ROLLBACK');
        return;
      }
    }
    
    // Fetch business details via GraphQL
    console.log('Fetching GraphQL details for', yelpId);
    const businessData = await fetchBusinessDetails(yelpId);
    if (!businessData) {
      console.warn('No GraphQL data returned for', yelpId);
      await client.query('ROLLBACK');
      return;
    }
    
    // Normalize GraphQL response
    const normalized = mapGraphqlBusiness(businessData);
    
    // Upsert into yelp_businesses table with GraphQL fields
    const upsertResult = await client.query(
      `INSERT INTO yelp_businesses (yelp_id, name, rating, review_count, price, hours, graphql_enriched, raw_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, now(), now())
       ON CONFLICT (yelp_id) DO UPDATE SET
         name = EXCLUDED.name,
         rating = EXCLUDED.rating,
         review_count = EXCLUDED.review_count,
         price = EXCLUDED.price,
         hours = EXCLUDED.hours,
         graphql_enriched = true,
         raw_data = EXCLUDED.raw_data,
         updated_at = now()
       RETURNING id`,
      [
        normalized.id,
        normalized.name,
        normalized.rating,
        normalized.review_count,
        normalized.price,
        normalized.hours ? JSON.stringify(normalized.hours) : null,
        normalized.raw
      ]
    );
    const yelpBusinessId = upsertResult.rows[0].id;
    
    // Create shop and barber records using existing helpers
    const shopId = await upsertShop(businessData);
    const barberId = await upsertBarber(businessData);
    await upsertLocation(barberId, businessData, shopId);
    
    // Upsert images with attribution
    if (normalized.images && normalized.images.length > 0) {
      for (const img of normalized.images) {
        await client.query(
          `INSERT INTO images (barber_id, shop_id, source, source_id, url, fetched_at)
           VALUES ($1, $2, 'yelp', $3, $4, now())
           ON CONFLICT (barber_id, url) DO NOTHING`,
          [barberId, shopId, normalized.id, img.url]
        );
      }
    }
    
    // Fetch and upsert reviews (paginated)
    console.log('Fetching GraphQL reviews for', yelpId);
    let offset = 0;
    const limit = 20;
    let hasMore = true;
    
    while (hasMore) {
      const reviewsData = await fetchBusinessReviews(yelpId, { limit, offset });
      if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
        hasMore = false;
        break;
      }
      
      const normalizedReviews = mapGraphqlReviews(reviewsData.reviews);
      for (const review of normalizedReviews) {
        await client.query(
          `INSERT INTO reviews (barber_id, shop_id, source, source_id, user_display, text, rating, created_at, raw_json)
           VALUES ($1, $2, 'yelp', $3, $4, $5, $6, $7, $8)
           ON CONFLICT (source, source_id) DO NOTHING`,
          [
            barberId,
            shopId,
            review.external_id,
            review.external_user_name,
            review.text,
            review.rating,
            review.created_at || new Date().toISOString(),
            review.raw
          ]
        );
      }
      
      offset += limit;
      hasMore = offset < reviewsData.total;
    }
    
    // Update review_cursor if pagination remains
    const reviewCursor = hasMore ? offset.toString() : null;
    await client.query(
      'UPDATE yelp_businesses SET review_cursor = $1 WHERE yelp_id = $2',
      [reviewCursor, yelpId]
    );
    
    await client.query('COMMIT');
    console.log('Successfully enriched', yelpId, 'via GraphQL as barberId', barberId);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('GraphQL enrichment failed for', yelpId, ':', err.message || err);
    // Fall back to REST if GraphQL fails and fallback is enabled
    if (process.env.YELP_GRAPHQL_FALLBACK_TO_REST === 'true') {
      console.log('Falling back to REST for', yelpId);
      const businessDetails = await yelpApi(`/businesses/${yelpId}`);
      const reviewsResp = await yelpApi(`/businesses/${yelpId}/reviews`);
      const shopId = await upsertShop(businessDetails);
      const barberId = await upsertBarber(businessDetails);
      await upsertLocation(barberId, businessDetails, shopId);
      await upsertImages(barberId, businessDetails, shopId);
      await upsertReviews(barberId, yelpId, reviewsResp.reviews || [], shopId);
    } else {
      throw err;
    }
  } finally {
    client.release();
  }
}

async function fetchBusinessesByLocation(locationString, limit = 5) {
  console.log('Fetch businesses for location:', locationString);
  const search = await yelpApi(`/businesses/search?term=barbers&location=${encodeURIComponent(locationString)}&limit=${limit}`);
  const businesses = search.businesses || [];
  for (const b of businesses) {
    await fetchBusinessDetailsAndPersist(b);
  }
}

module.exports = { fetchBusinessesByLocation, fetchBusinessDetailsAndPersist, enrichBusinessWithGraphql };

// CLI
if (require.main === module) {
  const loc = process.argv[2] || 'San Francisco, CA';
  fetchBusinessesByLocation(loc, 3).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
