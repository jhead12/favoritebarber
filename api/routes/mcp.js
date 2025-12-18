const express = require('express');
const router = express.Router();
const { pool } = require('../db');
// const llm = require('../../workers/llm/llm_client'); // TODO: restore when Docker build includes workers
const { requireScope } = require('../middleware/mcpAuth');
const { trackYelpCall } = require('../lib/mcpTelemetry');
const { createWebhookSubscription } = require('../lib/mcpWebhooks');

// Health/status for MCP
router.get('/health', (req, res) => {
  const info = { ok: true, time: new Date().toISOString() };
  if (req.mcp) info.partner = req.mcp.partnerId || null;
  res.json(info);
});

// POST /api/mcp/discover - Enqueue discovery job for social profile scraping
// Requires: write:discover scope
// Body: { shop_name, location_text, yelp_business_id }
router.post('/discover', requireScope('write:discover'), async (req, res) => {
  const { shop_name, location_text, yelp_business_id } = req.body || {};
  
  if (!shop_name && !yelp_business_id) {
    return res.status(400).json({ 
      error: 'missing_required_fields',
      message: 'Either shop_name or yelp_business_id is required' 
    });
  }

  try {
    // Insert discovery job
    const result = await pool.query(`
      INSERT INTO discovery_jobs 
      (shop_name, location_text, yelp_business_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', NOW(), NOW())
      RETURNING *
    `, [shop_name || null, location_text || null, yelp_business_id || null]);

    const job = result.rows[0];

    res.status(202).json({
      job_id: job.id,
      status: job.status,
      message: 'Discovery job enqueued',
      _links: {
        status: `/api/mcp/discover/${job.id}`
      }
    });

  } catch (err) {
    console.error('MCP /discover error', err);
    res.status(500).json({ error: 'failed_to_enqueue_job' });
  }
});

// GET /api/mcp/discover/:id - Check discovery job status
router.get('/discover/:id', async (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  
  if (isNaN(jobId)) {
    return res.status(400).json({ error: 'invalid_job_id' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM discovery_jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'job_not_found' });
    }

    const job = result.rows[0];

    res.json({
      job_id: job.id,
      status: job.status,
      shop_name: job.shop_name,
      yelp_business_id: job.yelp_business_id,
      attempts: job.attempts || 0,
      result: job.result || null,
      last_error: job.last_error || null,
      created_at: job.created_at,
      updated_at: job.updated_at
    });

  } catch (err) {
    console.error('MCP /discover/:id error', err);
    res.status(500).json({ error: 'internal_error' });
  }
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

// Live Yelp proxy - fetch business details via Yelp GraphQL
// GET /api/mcp/live_yelp/:id
// Requires: read:live_yelp scope
router.get('/live_yelp/:id', requireScope('read:live_yelp'), async (req, res) => {
  const enabled = process.env.MCP_ENABLE_LIVE_YELP === 'true';
  if (!enabled) {
    return res.status(403).json({ 
      error: 'live_yelp_disabled',
      message: 'Live Yelp proxy is disabled. Set MCP_ENABLE_LIVE_YELP=true to enable.' 
    });
  }

  const yelpId = req.params.id;
  if (!yelpId) {
    return res.status(400).json({ error: 'missing_yelp_id' });
  }

  try {
    // Import Yelp GraphQL client
    const { fetchBusinessDetails } = require('../yelp_graphql');
    const { circuitBreaker } = require('../lib/circuitBreaker');

    // Wrap in circuit breaker to prevent cascading failures
    const businessData = await circuitBreaker.fire(
      () => fetchBusinessDetails(yelpId),
      'yelp_graphql'
    );

    // Track Yelp API call for telemetry
    trackYelpCall(req, 1, 0.0001); // Estimate $0.0001 per call

    res.json({
      business: businessData,
      source: 'yelp_graphql',
      cached: false
    });

  } catch (err) {
    console.error('MCP /live_yelp error', err);
    
    // Check if circuit is open
    if (err.message && err.message.includes('circuit')) {
      return res.status(503).json({ 
        error: 'yelp_service_unavailable',
        message: 'Yelp GraphQL service is temporarily unavailable. Circuit breaker is open.' 
      });
    }

    res.status(500).json({ 
      error: 'yelp_fetch_failed',
      message: err.message || 'Failed to fetch business from Yelp' 
    });
  }
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

// POST /api/mcp/webhooks - Create webhook subscription
// Requires: write:webhooks scope
router.post('/webhooks', requireScope('write:webhooks'), async (req, res) => {
  const { url, events } = req.body;

  if (!url || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      error: 'missing_required_fields',
      message: 'url (string) and events (array) are required'
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({
      error: 'invalid_url',
      message: 'url must be a valid HTTP/HTTPS URL'
    });
  }

  // Validate events
  const validEvents = [
    'discovery.completed',
    'discovery.failed',
    'review.created',
    'review.updated',
    'barber.verified'
  ];

  const invalidEvents = events.filter(e => !validEvents.includes(e));
  if (invalidEvents.length > 0) {
    return res.status(400).json({
      error: 'invalid_events',
      message: `Invalid event types: ${invalidEvents.join(', ')}`,
      valid_events: validEvents
    });
  }

  try {
    const partnerId = req.mcp_partner.id;
    const webhook = await createWebhookSubscription(partnerId, url, events);

    res.status(201).json({
      webhook_id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      status: webhook.status,
      created_at: webhook.created_at,
      message: 'Webhook subscription created. Save the secret - it will not be shown again.'
    });

  } catch (err) {
    console.error('MCP /webhooks POST error', err);
    res.status(500).json({ error: 'failed_to_create_webhook' });
  }
});

// GET /api/mcp/webhooks - List webhooks
router.get('/webhooks', requireScope('write:webhooks'), async (req, res) => {
  try {
    const partnerId = req.mcp_partner.id;

    const result = await pool.query(`
      SELECT id, url, events, status, last_success_at, last_failure_at, failure_count, created_at, updated_at
      FROM mcp_webhooks
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `, [partnerId]);

    res.json({
      webhooks: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error('MCP /webhooks GET error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// DELETE /api/mcp/webhooks/:id - Delete webhook subscription
router.delete('/webhooks/:id', requireScope('write:webhooks'), async (req, res) => {
  const webhookId = parseInt(req.params.id, 10);

  if (isNaN(webhookId)) {
    return res.status(400).json({ error: 'invalid_webhook_id' });
  }

  try {
    const partnerId = req.mcp_partner.id;

    const result = await pool.query(`
      DELETE FROM mcp_webhooks
      WHERE id = $1 AND partner_id = $2
      RETURNING id
    `, [webhookId, partnerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'webhook_not_found' });
    }

    res.json({
      message: 'Webhook subscription deleted',
      webhook_id: webhookId
    });

  } catch (err) {
    console.error('MCP /webhooks DELETE error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;

