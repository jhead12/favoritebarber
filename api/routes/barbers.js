const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/barbers/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Support lookup by numeric internal id or by external Yelp business id
    const isNumeric = /^\d+$/.test(id);
    const barberQ = await pool.query(
      `SELECT b.*, l.id AS loc_id, l.formatted_address, l.latitude, l.longitude, l.verified AS location_verified
       FROM barbers b
       LEFT JOIN locations l ON b.primary_location_id = l.id
       WHERE ${isNumeric ? 'b.id = $1' : 'b.yelp_business_id = $1'} LIMIT 1`,
      [id]
    );
    if (barberQ.rowCount === 0) return res.status(404).json({ error: 'not_found' });
    const b = barberQ.rows[0];

    // Try to find an associated shop (if any)
    // When we looked up by Yelp id, ensure we use the internal barber id to join shop_barbers
    const barberInternalId = barberQ.rows[0].id;
    const shopQ = await pool.query(
      `SELECT s.* FROM shops s JOIN shop_barbers sb ON sb.shop_id = s.id WHERE sb.barber_id = $1 LIMIT 1`,
      [barberInternalId]
    );
    const shop = shopQ.rowCount ? shopQ.rows[0] : null;

    const out = {
      id: b.id,
      name: b.name,
      trust_score: { value: Number(b.trust_score) || 0, components: {} },
      primary_location: b.loc_id ? {
        id: b.loc_id,
        formatted_address: b.formatted_address,
        latitude: b.latitude,
        longitude: b.longitude,
        verified: !!b.location_verified
      } : null,
      metadata: b.metadata || {},
      created_at: b.created_at,
      updated_at: b.updated_at,
      business_profile_id: b.business_profile_id || null,
      credits: b.credits || 0,
      shop: shop ? {
        id: shop.id,
        name: shop.name,
        trust_score: Number(shop.trust_score) || 0,
        primary_location_id: shop.primary_location_id,
        metadata: shop.metadata || {}
      } : null
    };

    // Attach recent sanitized LLM-enriched comments (if available) from reviews.
    try {
      const revQ = await pool.query(
        `SELECT id, rating, created_at, review_summary, text
         FROM reviews
         WHERE barber_id = $1
         ORDER BY enriched_at DESC NULLS LAST, created_at DESC
         LIMIT 6`,
        [barberInternalId]
      );
      if (revQ.rowCount) {
        out.reviews = revQ.rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          created_at: r.created_at,
          // Prefer LLM-produced summary (sanitized). Fallback to raw text excerpt if summary missing.
          summary: r.review_summary || (r.text ? (r.text.length > 300 ? r.text.slice(0, 300) + '…' : r.text) : null),
          sanitized: !!r.review_summary,
        }));
      } else {
        out.reviews = [];
      }
    } catch (revErr) {
      console.error('barbers/:id reviews query error', revErr);
      out.reviews = [];
    }

    res.json(out);
  } catch (err) {
    console.error('barbers/:id error', err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
// TODO: implement barber profile endpoint
exports.handler = function (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'barber profile stub' }));
};
