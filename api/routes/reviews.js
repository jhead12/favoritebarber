const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/reviews/most-recent-positive?latitude=..&longitude=..&radius_miles=20
router.get('/most-recent-positive', async (req, res) => {
  const { latitude, longitude, radius_miles = 20 } = req.query;
  if (!latitude || !longitude) return res.status(400).json({ error: 'missing_coordinates' });

  const radiusMeters = Number(radius_miles) * 1609.34; // miles -> meters
  try {
    const q = `
      SELECT r.id AS review_id, r.rating, r.review_summary, r.text, r.created_at,
             b.id AS barber_id, b.name AS barber_name, b.trust_score,
             l.id AS loc_id, l.formatted_address, l.latitude, l.longitude,
             (6371000 * acos(
               cos(radians($1::double precision)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2::double precision))
               + sin(radians($1::double precision)) * sin(radians(l.latitude))
             )) AS distance_m
      FROM reviews r
      JOIN barbers b ON r.barber_id = b.id
      LEFT JOIN locations l ON b.primary_location_id = l.id
      WHERE (r.rating >= 4 OR r.enriched_sentiment = 1)
        AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND (6371000 * acos(
              cos(radians($1::double precision)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2::double precision))
              + sin(radians($1::double precision)) * sin(radians(l.latitude))
            )) <= $3
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    const qr = await pool.query(q, [Number(latitude), Number(longitude), radiusMeters]);
    if (qr.rowCount === 0) return res.json({ found: false });

    const row = qr.rows[0];
    return res.json({
      found: true,
      review: {
        id: row.review_id,
        rating: row.rating,
        created_at: row.created_at,
        summary: row.review_summary || (row.text ? (row.text.length > 300 ? row.text.slice(0, 300) + '…' : row.text) : null),
        sanitized: !!row.review_summary,
      },
      barber: {
        id: row.barber_id,
        name: row.barber_name,
        trust: Number(row.trust_score) || 0,
        location: row.formatted_address ? { id: row.loc_id, formatted_address: row.formatted_address, latitude: row.latitude, longitude: row.longitude } : null,
        distance_m: Number(row.distance_m) || 0,
      }
    });
  } catch (err) {
    console.error('reviews/most-recent-positive error', err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
