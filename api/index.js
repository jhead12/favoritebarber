// Express API server with basic /api/search route
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const { queryYelpGraphql } = require('./yelp_graphql');
const { mapRestBusiness, mapGraphqlBusiness } = require('./lib/yelp_normalize');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const agentsRoutes = require('./routes/agents');
const barbersRoutes = require('./routes/barbers');
const shopsRoutes = require('./routes/shops');
const adminRoutes = require('./routes/admin');
const geocodeRoutes = require('./routes/geocode');
const reviewCandidatesRoutes = require('./routes/review_candidates');
const reviewsRoutes = require('./routes/reviews');
const { requireAuth } = require('./middleware/auth');
const { requireMcpAuth } = require('./middleware/mcpAuth');
const { mcpRateLimitMiddleware } = require('./lib/mcpRateLimiter');
const mcpRoutes = require('./routes/mcp');
const app = express();
const YELP_API_KEY = process.env.YELP_API_KEY;
app.use(cors());
app.use(express.json());

// Mount auth routes (public)
app.use('/api/auth', authRoutes);

// Mount agents (public stub)
app.use('/api/agents', agentsRoutes);

// Mount barber routes
app.use('/api/barbers', barbersRoutes);

// Mount shop routes
app.use('/api/shops', shopsRoutes);

// Admin routes (data status)
app.use('/api/admin', adminRoutes);

// Geocoding helper (server-side key)
app.use('/api/geocode', geocodeRoutes);
// Review name candidates (extraction + listing)
app.use('/api/review-candidates', reviewCandidatesRoutes);

// Reviews helper routes (most-recent-positive, etc.)
app.use('/api/reviews', reviewsRoutes);

// Mount user routes (protected)
app.use('/api/users', requireAuth, userRoutes);

// MCP gateway routes (partner-facing). auth + rate-limit enforced here.
app.use('/api/mcp', requireMcpAuth, mcpRateLimitMiddleware, mcpRoutes);

// Lightweight Yelp proxy for search (term + location)
// Example: /api/yelp-search?term=fade&location=San%20Francisco
app.get('/api/yelp-search', async (req, res) => {
  if (!YELP_API_KEY) {
    return res.status(400).json({
      error: 'missing_yelp_api_key',
      message: 'YELP_API_KEY is not configured on the server. Add it to `api/.env` or set the environment variable. See `api/.env.example` for examples.'
    });
  }
  const { term = 'barber', location = 'San Francisco, CA', limit = 6 } = req.query;
  try {
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('term', String(term));
    url.searchParams.set('categories', 'barbers');
    url.searchParams.set('limit', String(limit));

    // Support latitude/longitude if provided (preferred over textual location)
    const { latitude, longitude } = req.query;
    if (latitude && longitude) {
      url.searchParams.set('latitude', String(latitude));
      url.searchParams.set('longitude', String(longitude));
    } else {
      url.searchParams.set('location', String(location));
    }

    const yelpRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });
    if (!yelpRes.ok) {
      const txt = await yelpRes.text();
      return res.status(502).json({ error: 'Yelp error', detail: txt });
    }
    const data = await yelpRes.json();
    const mapped = (data.businesses || []).map((b) => ({
      id: b.id,
      name: b.name,
      rating: b.rating,
      review_count: b.review_count,
      distance_m: b.distance,
      address: (b.location && b.location.display_address || []).join(', '),
      image_url: b.image_url,
      url: b.url,
      phone: b.display_phone,
      categories: (b.categories || []).map((c) => c.title),
      coordinates: b.coordinates || {},
    }));
    res.json({ results: mapped });
  } catch (err) {
    console.error('Yelp proxy error', err);
    res.status(500).json({ error: 'proxy_failed' });
  }
});

// Proxy to fetch a single Yelp business by id
app.get('/api/yelp-business/:id', async (req, res) => {
  const { id } = req.params || {};
  console.log('[API] yelp-business request for id:', id);
  if (!YELP_API_KEY) {
    return res.status(400).json({ error: 'missing_yelp_api_key', message: 'YELP_API_KEY not configured' });
  }
  try {
    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}`;
    const yelpRes = await fetch(url, { headers: { Authorization: `Bearer ${YELP_API_KEY}` } });
    if (!yelpRes.ok) {
      const txt = await yelpRes.text();
      return res.status(502).json({ error: 'Yelp error', detail: txt });
    }
    const b = await yelpRes.json();
    // Normalize REST response
    const out = mapRestBusiness(b) || {};
    res.json(out);
  } catch (err) {
    console.error('yelp-business proxy error', err);
    res.status(500).json({ error: 'proxy_failed' });
  }
});

// GraphQL proxy to fetch a single Yelp business by id (richer nested fields)
app.get('/api/yelp-graphql/business/:id', async (req, res) => {
  const { id } = req.params || {};
  if (!YELP_API_KEY) return res.status(400).json({ error: 'missing_yelp_api_key', message: 'YELP_API_KEY not configured' });
  try {
    const query = `
{
  business(id: "${String(id).replace(/"/g, '\\"')}") {
    id
    name
    alias
    rating
    url
    photos
    categories { title }
    location { address1 address2 address3 city state postal_code country }
    hours { open { day start end is_overnight } }
  }
}
`;
    const gql = await queryYelpGraphql(query);
    if (!gql || !gql.data || !gql.data.business) {
      const errText = (gql && gql.errors) ? JSON.stringify(gql.errors) : 'no_business';
      return res.status(502).json({ error: 'GraphQL error', detail: errText });
    }
    const b = gql.data.business;
    const out = mapGraphqlBusiness(b) || {};
    res.json(out);
  } catch (err) {
    console.error('yelp-graphql proxy error', err);
    res.status(500).json({ error: 'graphql_proxy_failed' });
  }
});

app.get('/api/search', async (req, res) => {
  // Basic search returning seeded barbers
  try {
    const { latitude, longitude } = req.query;
    let rows;
    if (latitude && longitude) {
      // When coordinates are provided, compute distance using haversine-like formula in SQL
      const q = `
        SELECT b.id, b.name, b.trust_score, l.latitude AS loc_lat, l.longitude AS loc_lon, l.formatted_address,
          (6371000 * acos(
            cos(radians($1::double precision)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2::double precision))
            + sin(radians($1::double precision)) * sin(radians(l.latitude))
          )) AS distance_m
        FROM barbers b
        LEFT JOIN locations l ON b.primary_location_id = l.id
        ORDER BY distance_m NULLS LAST
        LIMIT 50
      `;
      const qr = await pool.query(q, [Number(latitude), Number(longitude)]);
      rows = qr.rows;
    } else {
      const qr = await pool.query('SELECT b.id, b.name, b.trust_score, l.latitude AS loc_lat, l.longitude AS loc_lon, l.formatted_address FROM barbers b LEFT JOIN locations l ON b.primary_location_id = l.id LIMIT 50');
      rows = qr.rows;
    }

    const results = rows.map(r => ({
      id: r.id,
      name: r.name,
      primary_location: r.formatted_address ? { latitude: r.loc_lat, longitude: r.loc_lon, formatted_address: r.formatted_address } : { latitude: 0, longitude: 0, formatted_address: '' },
      distance_m: r.distance_m ? Number(r.distance_m) : 0,
      // PG returns NUMERIC as string; ensure numeric type for frontend consumers
      trust_score: { value: Number(r.trust_score) || 0, components: {} },
      thumbnail_url: '',
      top_tags: [],
      snippet: ''
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Cached search endpoint: looks up nearby cached businesses or falls back to Yelp
app.get('/api/yelp-cached-search', async (req, res) => {
  if (!YELP_API_KEY) {
    return res.status(400).json({ error: 'missing_yelp_api_key', message: 'YELP_API_KEY is not configured on the server.' });
  }
  try {
    const lat = parseFloat(req.query.latitude);
    const lon = parseFloat(req.query.longitude);
    const radius_m = Number(req.query.radius_m || 1000);
    const term = String(req.query.term || 'barber');

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      // Find cached businesses within radius using haversine in SQL
      const q = `
        SELECT *, (
          6371000 * acos(
            cos(radians($1::double precision)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::double precision))
            + sin(radians($1::double precision)) * sin(radians(latitude))
          )
        ) AS distance_m
        FROM yelp_businesses
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        HAVING (
          6371000 * acos(
            cos(radians($1::double precision)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::double precision))
            + sin(radians($1::double precision)) * sin(radians(latitude))
          )
        ) <= $3
        ORDER BY distance_m ASC
        LIMIT 50
      `;
      const qr = await pool.query(q, [lat, lon, Number(radius_m)]);
      if (qr.rows && qr.rows.length > 0) {
        // Return cached results (map raw JSONB to simplified shape)
        const results = qr.rows.map(r => {
          const raw = r.raw || {};
          return {
            id: r.id,
            name: r.name || (raw && raw.name) || null,
            rating: r.rating || (raw && raw.rating) || null,
            distance_m: Number(r.distance_m || 0),
            address: r.address || (raw && raw.location && raw.location.display_address ? raw.location.display_address.join(', ') : ''),
            image_url: (r.images && r.images.length) ? r.images[0] : (raw && raw.image_url) || null,
            raw
          };
        });
        return res.json({ results, source: 'cache' });
      }
    }

    // No cached results — call Yelp REST search, persist results, and return
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('term', term);
    url.searchParams.set('categories', 'barbers');
    url.searchParams.set('limit', String(20));
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
    } else if (req.query.location) {
      url.searchParams.set('location', String(req.query.location));
    }

    const yRes = await fetch(url.toString(), { headers: { Authorization: `Bearer ${YELP_API_KEY}` } });
    if (!yRes.ok) {
      const txt = await yRes.text().catch(() => null);
      return res.status(502).json({ error: 'Yelp error', detail: txt });
    }
    const data = await yRes.json();
    const mapped = (data.businesses || []).map((b) => ({
      id: b.id,
      name: b.name,
      rating: b.rating,
      review_count: b.review_count,
      distance_m: b.distance,
      address: (b.location && b.location.display_address || []).join(', '),
      image_url: b.image_url,
      url: b.url,
      phone: b.display_phone,
      categories: (b.categories || []).map((c) => c.title),
      coordinates: b.coordinates || {},
    }));

    // Persist businesses into yelp_businesses table (upsert)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const b of data.businesses || []) {
        const latb = b.coordinates && b.coordinates.latitude ? b.coordinates.latitude : null;
        const lonb = b.coordinates && b.coordinates.longitude ? b.coordinates.longitude : null;
        const images = b.photos || (b.image_url ? [b.image_url] : []);
        const rawJson = JSON.stringify(b);
        await client.query(
          `INSERT INTO yelp_businesses (id, raw, latitude, longitude, name, address, rating, images, categories, last_fetched_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
           ON CONFLICT (id) DO UPDATE SET raw = EXCLUDED.raw, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, name = EXCLUDED.name, address = EXCLUDED.address, rating = EXCLUDED.rating, images = EXCLUDED.images, categories = EXCLUDED.categories, last_fetched_at = now()`,
          [b.id, rawJson, latb, lonb, b.name, (b.location && b.location.display_address ? b.location.display_address.join(', ') : ''), b.rating || null, JSON.stringify(images), JSON.stringify((b.categories || []).map(c => c.title))]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('persist yelp businesses failed', e);
    } finally {
      client.release();
    }

    const results = mapped.map(m => ({ ...m, raw: m }));
    // Enqueue GraphQL enrichment for top 3 results (best-effort)
    try {
      const enqueue = require('./jobs/scoreRecomputation'); // reuse jobs loader; adapt if needed
      // lightweight enqueue: push IDs to Redis or a job table — here we just log for now
      results.slice(0,3).forEach(r => console.log('[ENQUEUE] graphql-enrich', r.id));
    } catch (e) {}

    return res.json({ results, source: 'yelp' });
  } catch (err) {
    console.error('yelp-cached-search error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/', (req, res) => res.send('Rate Your Barber API'));

// Initialize background jobs
const { initializeJobs } = require('./jobs/scoreRecomputation');
initializeJobs();

// Mount POST /api/search to enqueue background discovery jobs
const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));
