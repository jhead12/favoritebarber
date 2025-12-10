// Express API server with basic /api/search route
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const agentsRoutes = require('./routes/agents');
const barbersRoutes = require('./routes/barbers');
const { requireAuth } = require('./middleware/auth');
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

// Mount user routes (protected)
app.use('/api/users', requireAuth, userRoutes);

// Lightweight Yelp proxy for search (term + location)
// Example: /api/yelp-search?term=fade&location=San%20Francisco
app.get('/api/yelp-search', async (req, res) => {
  if (!YELP_API_KEY) {
    return res.status(500).json({ error: 'YELP_API_KEY not set on server' });
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

app.get('/api/search', async (req, res) => {
  // Basic search returning seeded barbers
  try {
    const { rows } = await pool.query('SELECT id, name, trust_score FROM barbers LIMIT 50');
    const results = rows.map(r => ({
      id: r.id,
      name: r.name,
      primary_location: { latitude: 0, longitude: 0, formatted_address: '' },
      distance_m: 0,
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

app.get('/', (req, res) => res.send('Rate Your Barber API'));

// Initialize background jobs
const { initializeJobs } = require('./jobs/scoreRecomputation');
initializeJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));
