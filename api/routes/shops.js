const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Accept either numeric DB id or Yelp business id (string). If id is not an integer, try yelp_business_id lookup.
    let q;
    if (/^\d+$/.test(String(id))) {
      q = await pool.query('SELECT * FROM shops WHERE id = $1 LIMIT 1', [id]);
    } else {
      q = await pool.query('SELECT * FROM shops WHERE yelp_business_id = $1 LIMIT 1', [id]);
    }
    if (q.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    const s = q.rows[0];

    const out = {
      id: s.id,
      name: s.name,
      yelp_business_id: s.yelp_business_id,
      trust_score: Number(s.trust_score) || 0,
      metadata: s.metadata || {},
      primary_location_id: s.primary_location_id || null,
      website: (s.metadata && s.metadata.url) || null,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };

    // Try to get website from Yelp business data if not in shop metadata
    if (!out.website && s.yelp_business_id) {
      try {
        const yelpQ = await pool.query(
          'SELECT raw FROM yelp_businesses WHERE id = $1',
          [s.yelp_business_id]
        );
        if (yelpQ.rowCount > 0 && yelpQ.rows[0].raw) {
          out.website = yelpQ.rows[0].raw.url || yelpQ.rows[0].raw.website || null;
        }
      } catch (e) {
        // ignore
      }
    }

    // images for shop with attribution metadata and hairstyles
    try {
      const imgs = await pool.query(
        `SELECT id, url, source, width, height, relevance_score, hairstyles, attribution_metadata, caption, fetched_at 
         FROM images 
         WHERE shop_id = $1 AND COALESCE(relevance_score, 0) > 0.5
         ORDER BY relevance_score DESC NULLS LAST, fetched_at DESC 
         LIMIT 20`, 
        [s.id]
      );
      out.images = imgs.rowCount ? imgs.rows.map(img => ({
        id: img.id,
        url: img.url,
        source: img.source,
        width: img.width,
        height: img.height,
        relevance_score: img.relevance_score,
        hairstyles: img.hairstyles || [],
        attribution: img.attribution_metadata || null,
        caption: img.caption || null,
        fetched_at: img.fetched_at
      })) : [];
    } catch (imgErr) {
      console.error('shops/:id images query error', imgErr);
      out.images = [];
    }

    // associated barbers
    try {
      const bq = await pool.query(
        `SELECT b.id, b.name, b.trust_score, b.claimed_by_user_id, l.formatted_address, l.latitude, l.longitude
         FROM shop_barbers sb JOIN barbers b ON sb.barber_id = b.id
         LEFT JOIN locations l ON b.primary_location_id = l.id
         WHERE sb.shop_id = $1 AND sb.is_current = true`,
        [s.id]
      );
      out.barbers = bq.rowCount ? bq.rows.map(r => ({ 
        id: r.id, 
        name: r.name, 
        trust_score: Number(r.trust_score)||0, 
        primary_location: r.formatted_address,
        is_claimed: !!r.claimed_by_user_id 
      })) : [];
    } catch (bErr) {
      console.error('shops/:id barbers query error', bErr);
      out.barbers = [];
    }

    // Attach recent sanitized LLM-enriched comments (if available) from reviews.
    // Include reviews for the shop AND all barbers associated with the shop.
    try {
      const revQ = await pool.query(
        `SELECT r.id, r.rating, r.created_at, r.review_summary, r.text, r.hairstyles, r.extracted_names, b.name as barber_name
         FROM reviews r
         LEFT JOIN barbers b ON r.barber_id = b.id
         WHERE r.shop_id = $1 
            OR r.barber_id IN (
              SELECT barber_id FROM shop_barbers WHERE shop_id = $1 AND is_current = true
            )
         ORDER BY r.enriched_at DESC NULLS LAST, r.created_at DESC
         LIMIT 20`,
        [s.id]
      );
      if (revQ.rowCount) {
        out.reviews = revQ.rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          created_at: r.created_at,
          text: r.text || null,
          summary: r.review_summary || (r.text ? (r.text.length > 300 ? r.text.slice(0, 300) + '…' : r.text) : null),
          sanitized: !!r.review_summary,
          hairstyles: r.hairstyles || [],
          barber_name: r.barber_name || null,
          extracted_names: r.extracted_names || null,
        }));
      } else {
        out.reviews = [];
      }
    } catch (revErr) {
      console.error('shops/:id reviews query error', revErr);
      out.reviews = [];
    }

    res.json(out);
  } catch (err) {
    console.error('shops/:id error', err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
