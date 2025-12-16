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
      created_at: s.created_at,
      updated_at: s.updated_at,
    };

    // images for shop
    try {
      const imgs = await pool.query('SELECT id, url, width, height, fetched_at FROM images WHERE shop_id = $1 ORDER BY fetched_at DESC LIMIT 20', [s.id]);
      out.images = imgs.rowCount ? imgs.rows : [];
    } catch (imgErr) {
      console.error('shops/:id images query error', imgErr);
      out.images = [];
    }

    // associated barbers
    try {
      const bq = await pool.query(
        `SELECT b.id, b.name, b.trust_score, l.formatted_address, l.latitude, l.longitude
         FROM shop_barbers sb JOIN barbers b ON sb.barber_id = b.id
         LEFT JOIN locations l ON b.primary_location_id = l.id
         WHERE sb.shop_id = $1 AND sb.is_current = true`,
        [s.id]
      );
      out.barbers = bq.rowCount ? bq.rows.map(r => ({ id: r.id, name: r.name, trust_score: Number(r.trust_score)||0, primary_location: r.formatted_address })) : [];
    } catch (bErr) {
      console.error('shops/:id barbers query error', bErr);
      out.barbers = [];
    }

    res.json(out);
  } catch (err) {
    console.error('shops/:id error', err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
