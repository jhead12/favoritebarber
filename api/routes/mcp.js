const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const llm = require('../../workers/llm/llm_client');

// Health/status for MCP
router.get('/health', (req, res) => {
  const info = { ok: true, time: new Date().toISOString() };
  if (req.mcp) info.partner = req.mcp.partnerId || null;
  res.json(info);
});

// Return a list of barbers backed by the `barber_detailed_info` view.
// Applies light partner scoping placeholder (future: tenant filtering).
router.get('/barbers', async (req, res) => {
  try {
    // Basic limit + paging
    const limit = Math.min(100, Number(req.query.limit || 50));
    const offset = Math.max(0, Number(req.query.offset || 0));

    const q = `SELECT id, name, trust_score, primary_location, thumbnail_url, top_tags, price FROM barber_detailed_info ORDER BY trust_score DESC NULLS LAST LIMIT $1 OFFSET $2`;
    let rows = [];
    try {
      const qr = await pool.query(q, [limit, offset]);
      rows = qr.rows || [];
    } catch (err) {
      // View might not exist yet; return empty list and a helpful message in debug
      console.warn('MCP /barbers: query failed (view missing?):', err && err.message);
      return res.json({ results: [], warning: 'barber_detailed_info view not available' });
    }

    const results = rows.map(r => ({
      id: r.id,
      name: r.name,
      trust_score: typeof r.trust_score === 'object' && r.trust_score ? r.trust_score.value || null : (r.trust_score || null),
      primary_location: r.primary_location || null,
      thumbnail_url: r.thumbnail_url || null,
      top_tags: r.top_tags || [],
      price: r.price || null,
    }));

    res.json({ results });
  } catch (err) {
    console.error('MCP /barbers error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Feature-flagged live Yelp proxy (stub)
router.get('/live_yelp/:id', (req, res) => {
  const enabled = process.env.MCP_ENABLE_LIVE_YELP === 'true';
  if (!enabled) return res.status(403).json({ error: 'live_yelp_disabled' });
  // For now respond with a placeholder — implementation should call the Yelp GraphQL client
  res.json({ message: 'live_yelp proxy stub', id: req.params.id, partner: req.mcp && req.mcp.partnerId });
});

// Enrich recent reviews for a barber or for all barbers at a shop.
// GET /api/mcp/enrich/reviews?barber_id=123 OR ?shop_id=45&limit=5
router.get('/enrich/reviews', async (req, res) => {
  const { barber_id, shop_id } = req.query;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 5)));
  if (!barber_id && !shop_id) return res.status(400).json({ error: 'missing_barber_or_shop_id' });

  try {
    // Resolve barber ids
    let barberIds = [];
    if (barber_id) {
      barberIds = [Number(barber_id)];
    } else {
      const qr = await pool.query('SELECT barber_id FROM shop_barbers WHERE shop_id = $1 AND is_current = true', [Number(shop_id)]);
      barberIds = qr.rows.map(r => r.barber_id).filter(Boolean);
      if (barberIds.length === 0) return res.status(404).json({ error: 'no_barbers_found_for_shop' });
    }

    // Fetch recent reviews with text
    const q = `SELECT id, barber_id, text, rating, created_at FROM reviews WHERE barber_id = ANY($1) AND text IS NOT NULL ORDER BY created_at DESC LIMIT $2`;
    const qr = await pool.query(q, [barberIds, limit]);
    if (!qr.rows || qr.rows.length === 0) return res.json({ count: 0, results: [] });

    // Ensure LLM provider initialized (best-effort)
    try { await llm.init(); } catch (e) { /* best-effort */ }

    const results = [];
    for (const row of qr.rows) {
      const text = row.text || '';
      let names = [];
      let sentiment = 0;
      let summary = '';
      try {
        names = await llm.extractNamesFromReview(text);
      } catch (e) { console.warn('extractNamesFromReview failed', e && e.message); names = []; }
      try {
        sentiment = await llm.analyzeSentiment(text);
      } catch (e) { console.warn('analyzeSentiment failed', e && e.message); sentiment = 0; }
      try {
        summary = await llm.summarizeReview(text, 24);
      } catch (e) { console.warn('summarizeReview failed', e && e.message); summary = (text || '').slice(0, 140); }

      // Persist enrichment fields back to reviews table (best-effort)
      try {
        const namesText = Array.isArray(names) ? names.join(', ') : (names || null);
        await pool.query('UPDATE reviews SET extracted_names = $1, review_summary = $2, enriched_at = now() WHERE id = $3', [namesText, summary, row.id]);
      } catch (e) {
        console.warn('persist enrichment failed for review', row.id, e && e.message);
      }

      results.push({ review_id: row.id, barber_id: row.barber_id, created_at: row.created_at, rating: row.rating, names, sentiment, summary });
    }

    res.json({ count: results.length, results });
  } catch (err) {
    console.error('MCP /enrich/reviews error', err && err.message || err);
    res.status(500).json({ error: 'enrichment_failed' });
  }
});

module.exports = router;

