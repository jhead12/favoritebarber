// Search route: enqueue background discovery jobs when users search for a shop
// Query params supported: query (shop name), location (text), yelp_id
// Returns a job id and status. Background daemon will process discovery_jobs table.

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /api/search  { query, location, yelp_id }
// Persist a search event in `search_queries` and enqueue a discovery job.
router.post('/', async (req, res) => {
  const { query, location, yelp_id } = req.body || {};
  if (!query && !yelp_id) return res.status(400).json({ error: 'query_or_yelp_id_required' });
  try {
    // store the search event
    const ua = req.headers['user-agent'] || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const sq = await pool.query(
      `INSERT INTO search_queries (query_text, location_text, user_agent, ip_address, created_at, updated_at) VALUES ($1,$2,$3,$4, now(), now()) RETURNING *`,
      [query || null, location || null, ua, ip]
    );

    // enqueue discovery job referencing the search event (link via search_query_id)
    const dj = await pool.query(
      `INSERT INTO discovery_jobs (shop_name, location_text, yelp_business_id, search_query_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4,'pending', now(), now()) RETURNING *`,
      [query || null, location || null, yelp_id || null, sq.rows[0].id]
    );

    return res.status(202).json({ search: sq.rows[0], job: dj.rows[0] });
  } catch (e) {
    console.error('enqueue discovery job error', e);
    return res.status(500).json({ error: 'db_error' });
  }
});

// GET /api/search/jobs/:id - get job status
router.get('/jobs/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const r = await pool.query('SELECT * FROM discovery_jobs WHERE id=$1 LIMIT 1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error('discovery job fetch error', e);
    return res.status(500).json({ error: 'db_error' });
  }
});

// GET /api/search/queries/:id - get search query and results
router.get('/queries/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const r = await pool.query('SELECT * FROM search_queries WHERE id=$1 LIMIT 1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'not_found' });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error('search query fetch error', e);
    return res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
