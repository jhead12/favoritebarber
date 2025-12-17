// Express API server with basic /api/search route
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requestLoggerMiddleware, logger, logExternalCall } = require('./lib/logger');
const { CircuitBreaker } = require('./lib/circuitBreaker');
const { costTracker } = require('./lib/costTracker');
const { pool } = require('./db');
const { queryYelpGraphql } = require('./yelp_graphql');
const { mapRestBusiness, mapGraphqlBusiness } = require('./lib/yelp_normalize');
const { acquireYelpToken } = require('./lib/mcpRateLimiter');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const agentsRoutes = require('./routes/agents');
const barbersRoutes = require('./routes/barbers');
const shopsRoutes = require('./routes/shops');
const adminRoutes = require('./routes/admin');
const geocodeRoutes = require('./routes/geocode');
const reviewCandidatesRoutes = require('./routes/review_candidates');
const reviewsRoutes = require('./routes/reviews');
const claimsRoutes = require('./routes/claims');
const { requireAuth } = require('./middleware/auth');
const { requireMcpAuth } = require('./middleware/mcpAuth');
const { mcpRateLimitMiddleware } = require('./lib/mcpRateLimitMiddleware');
const { mcpTelemetryMiddleware } = require('./lib/mcpTelemetry');
const mcpRoutes = require('./routes/mcp');const adminPartnersRoutes = require('./routes/admin/partners');const app = express();
// Initialize Sentry (optional)
const { initSentry, requestHandler: sentryRequestHandler, errorHandler: sentryErrorHandler } = require('./lib/sentry');
initSentry();
// Breaker for Yelp outbound calls
const yelpBreaker = new CircuitBreaker({ failureThreshold: 5, successThreshold: 2, timeoutMs: Number(process.env.YELP_BREAKER_TIMEOUT_MS || 10000), resetMs: Number(process.env.YELP_BREAKER_RESET_MS || 30000) });
const YELP_API_KEY = process.env.YELP_API_KEY;
app.use(cors());
app.use(express.json());
// Attach Sentry request handler early in the pipeline (no-op when Sentry not configured)
app.use(sentryRequestHandler());
app.use(requestLoggerMiddleware);

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

// Mount claims routes (profile claiming)
app.use('/api/claims', claimsRoutes);

// MCP gateway routes (partner-facing). auth + rate-limit + telemetry enforced here.
app.use('/api/mcp', requireMcpAuth, mcpRateLimitMiddleware, mcpTelemetryMiddleware, mcpRoutes);

// Admin routes (partner management)
app.use('/api/admin/partners', requireMcpAuth, adminPartnersRoutes);

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

    // Enforce combined Yelp quota (REST + GraphQL)
    try {
      const accountId = (req.mcp && req.mcp.partnerId) || process.env.YELP_ACCOUNT_ID || 'default';
      const q = await acquireYelpToken({ accountId, cost: 1 });
      if (!q || !q.ok) return res.status(429).json({ error: 'yelp_quota_exceeded', detail: q });
    } catch (e) {
      console.warn('acquireYelpToken failed for /api/yelp-search', e);
    }

    let yelpRes;
    try {
      const start = Date.now();
      yelpRes = await yelpBreaker.exec(() => logExternalCall({ provider: 'yelp', operation: 'rest_search', fn: () => fetch(url.toString(), { headers: { Authorization: `Bearer ${YELP_API_KEY}` } }) }));
      const durationMs = Date.now() - start;
      try { costTracker.record({ provider: 'yelp', model: 'rest_search', cost: 1, quotaCost: 1, durationMs, success: yelpRes && yelpRes.ok }); } catch (e) { logger.warn({ err: e }, 'costTracker.record failed'); }
    } catch (err) {
      logger.error({ err, route: '/api/yelp-search' }, 'Yelp REST search failed');
      return res.status(502).json({ error: 'Yelp error', detail: String(err) });
    }
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
    logger.error({ err, route: '/api/yelp-search' }, 'Yelp proxy error');
    res.status(500).json({ error: 'proxy_failed' });
  }
});

// Proxy to fetch a single Yelp business by id
app.get('/api/yelp-business/:id', async (req, res) => {
  const { id } = req.params || {};
  logger.info({ id }, '[API] yelp-business request');
  if (!YELP_API_KEY) {
    return res.status(400).json({ error: 'missing_yelp_api_key', message: 'YELP_API_KEY not configured' });
  }
  try {
    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}`;
    try {
      const accountId = (req.mcp && req.mcp.partnerId) || process.env.YELP_ACCOUNT_ID || 'default';
      const q = await acquireYelpToken({ accountId, cost: 1 });
      if (!q || !q.ok) return res.status(429).json({ error: 'yelp_quota_exceeded', detail: q });
    } catch (e) {
      console.warn('acquireYelpToken failed for /api/yelp-business', e);
    }

    let yelpRes;
    try {
      const start = Date.now();
      yelpRes = await yelpBreaker.exec(() => logExternalCall({ provider: 'yelp', operation: 'rest_business', fn: () => fetch(url, { headers: { Authorization: `Bearer ${YELP_API_KEY}` } }) }));
      const durationMs = Date.now() - start;
      try { costTracker.record({ provider: 'yelp', model: 'rest_business', cost: 1, quotaCost: 1, durationMs, success: yelpRes && yelpRes.ok }); } catch (e) { logger.warn({ err: e }, 'costTracker.record failed'); }
    } catch (err) {
      logger.error({ err, route: '/api/yelp-business/:id' }, 'Yelp REST business fetch failed');
      return res.status(502).json({ error: 'Yelp error', detail: String(err) });
    }
    if (!yelpRes.ok) {
      const txt = await yelpRes.text();
      return res.status(502).json({ error: 'Yelp error', detail: txt });
    }
    const b = await yelpRes.json();
    // Normalize REST response
    const out = mapRestBusiness(b) || {};
    res.json(out);
  } catch (err) {
    logger.error({ err, route: '/api/yelp-business/:id' }, 'yelp-business proxy error');
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
    if (!gql || !gql.business) {
      const errText = (gql && gql.errors) ? JSON.stringify(gql.errors) : 'no_business';
      return res.status(502).json({ error: 'GraphQL error', detail: errText });
    }
    const b = gql.business;
    const out = mapGraphqlBusiness(b) || {};
    res.json(out);
  } catch (err) {
    logger.error({ err, route: '/api/yelp-graphql/business/:id' }, 'yelp-graphql proxy error');
    res.status(500).json({ error: 'graphql_proxy_failed' });
  }
});

app.get('/api/search', async (req, res) => {
  // Basic local discovery: return only enriched barbers (and nearby cached shops when coords provided)
  try {
    const { latitude, longitude } = req.query;
    const results = [];

    // Helper: select barbers that have been enriched (reviews.enriched_at) or have high-relevance images
    if (latitude && longitude) {
      const hav = `(6371000 * acos(
            cos(radians($1::double precision)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2::double precision))
            + sin(radians($1::double precision)) * sin(radians(l.latitude))
          ))`;
      const bq = `
        SELECT b.id, b.name, b.trust_score, l.latitude AS loc_lat, l.longitude AS loc_lon, l.formatted_address,
          ${hav} AS distance_m
        FROM barbers b
        LEFT JOIN locations l ON b.primary_location_id = l.id
        WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.barber_id = b.id AND r.enriched_at IS NOT NULL)
           OR EXISTS (SELECT 1 FROM images i WHERE i.barber_id = b.id AND COALESCE(i.relevance_score,0) > 0.5)
        ORDER BY distance_m NULLS LAST
        LIMIT 50
      `;
      const qr = await pool.query(bq, [Number(latitude), Number(longitude)]);
      for (const r of qr.rows) {
        results.push({
          id: r.id,
          name: r.name,
          primary_location: r.formatted_address ? { latitude: r.loc_lat, longitude: r.loc_lon, formatted_address: r.formatted_address } : { latitude: 0, longitude: 0, formatted_address: '' },
          distance_m: r.distance_m ? Number(r.distance_m) : 0,
          trust_score: { value: Number(r.trust_score) || 0, components: {} },
          thumbnail_url: '',
          top_tags: [],
          snippet: '',
        });
      }

      // Also include cached nearby shops from yelp_businesses (if present in DB)
      try {
        const shopQ = `
          SELECT id, name, latitude, longitude, address, rating, images, raw,
            (6371000 * acos(
              cos(radians($1::double precision)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::double precision))
              + sin(radians($1::double precision)) * sin(radians(latitude))
            )) AS distance_m
          FROM yelp_businesses
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          HAVING (6371000 * acos(
              cos(radians($1::double precision)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2::double precision))
              + sin(radians($1::double precision)) * sin(radians(latitude))
            )) <= $3
          ORDER BY distance_m ASC
          LIMIT 50
        `;
        const radius_m = Number(req.query.radius_m || 5000);
        const sq = await pool.query(shopQ, [Number(latitude), Number(longitude), radius_m]);
        if (sq.rows && sq.rows.length) {
          for (const s of sq.rows) {
            const imageUrl = (s.images && s.images.length) ? s.images[0] : (s.raw && s.raw.image_url) || null;
            results.push({
              id: s.id,
              name: s.name,
              rating: s.rating || null,
              distance_m: Number(s.distance_m || 0),
              address: s.address || (s.raw && s.raw.location && s.raw.location.display_address ? s.raw.location.display_address.join(', ') : ''),
              image_url: imageUrl,
              raw: s.raw || null,
            });
          }
        }
      } catch (e) {
        logger.warn({ err: e }, 'failed to include cached shops in /api/search');
      }
    } else {
      // No coords provided: return enriched barbers (first 50)
      const qr = await pool.query(`SELECT b.id, b.name, b.trust_score, l.latitude AS loc_lat, l.longitude AS loc_lon, l.formatted_address
        FROM barbers b LEFT JOIN locations l ON b.primary_location_id = l.id
        WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.barber_id = b.id AND r.enriched_at IS NOT NULL)
           OR EXISTS (SELECT 1 FROM images i WHERE i.barber_id = b.id AND COALESCE(i.relevance_score,0) > 0.5)
        LIMIT 50`);
      for (const r of qr.rows) {
        results.push({
          id: r.id,
          name: r.name,
          primary_location: r.formatted_address ? { latitude: r.loc_lat, longitude: r.loc_lon, formatted_address: r.formatted_address } : { latitude: 0, longitude: 0, formatted_address: '' },
          distance_m: 0,
          trust_score: { value: Number(r.trust_score) || 0, components: {} },
          thumbnail_url: '',
          top_tags: [],
          snippet: '',
        });
      }
    }

    return res.json(results);
  } catch (err) {
    logger.error({ err, route: '/api/search' }, 'DB error');
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

    try {
      const accountId = (req.mcp && req.mcp.partnerId) || process.env.YELP_ACCOUNT_ID || 'default';
      const q = await acquireYelpToken({ accountId, cost: 1 });
      if (!q || !q.ok) return res.status(429).json({ error: 'yelp_quota_exceeded', detail: q });
    } catch (e) {
      console.warn('acquireYelpToken failed for /api/yelp-cached-search', e);
    }

    let yRes;
    try {
      const start = Date.now();
      yRes = await yelpBreaker.exec(() => logExternalCall({ provider: 'yelp', operation: 'rest_search_cached', fn: () => fetch(url.toString(), { headers: { Authorization: `Bearer ${YELP_API_KEY}` } }) }));
      const durationMs = Date.now() - start;
      try { costTracker.record({ provider: 'yelp', model: 'rest_search', cost: 1, quotaCost: 1, durationMs, success: yRes && yRes.ok }); } catch (e) { logger.warn({ err: e }, 'costTracker.record failed'); }
    } catch (err) {
      logger.error({ err, route: '/api/yelp-cached-search' }, 'Yelp REST cached search failed');
      const txt = String(err);
      return res.status(502).json({ error: 'Yelp error', detail: txt });
    }
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
      logger.error({ err: e }, 'persist yelp businesses failed');
    } finally {
      client.release();
    }

    const results = mapped.map(m => ({ ...m, raw: m }));
    // Enqueue GraphQL enrichment for top 3 results (best-effort)
    try {
      const enqueue = require('./jobs/scoreRecomputation'); // reuse jobs loader; adapt if needed
      // lightweight enqueue: push IDs to Redis or a job table — here we just log for now
      results.slice(0,3).forEach(r => console.log('[ENQUEUE] graphql-enrich', r.id));
    } catch (e) { logger.warn({ err: e }, 'enqueue graphql enrich failed'); }

    return res.json({ results, source: 'yelp' });
  } catch (err) {
    logger.error({ err, route: '/api/yelp-cached-search' }, 'yelp-cached-search error');
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

// Attach Sentry error handler after routes (no-op when Sentry not configured)
app.use(sentryErrorHandler());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info({ port: PORT, env: process.env.NODE_ENV }, 'API server listening'));
