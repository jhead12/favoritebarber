const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Simple heuristic name extractor (based on test_review_parser.js)
function extractCandidateNames(text) {
  const candidates = new Set();
  if (!text) return [];
  const patterns = [
    /to\s+([A-Z][a-z]{1,30})\s+at/i,
    /to\s+([A-Z][a-z]{1,30})[\.\!]/i,
    /by\s+([A-Z][a-z]{1,30})/i,
    /ask for\s+([A-Z][a-z]{1,30})/i,
    /mention[:\s]+([A-Z][a-z]{1,30})/i,
    /shoutout to\s+([A-Z][a-z]{1,30})/i,
    /special mention[:\s]*([A-Z][a-z]{1,30})/i,
    /today\s+([A-Z][a-z]{1,30})\s+was/i,
    /with\s+([A-Z][a-z]{1,30})\s+after/i
  ];

  for (const pat of patterns) {
    const m = pat.exec(text);
    if (m && m[1]) {
      candidates.add(capitalize(m[1]));
    }
  }

  // fallback: capitalized tokens
  const words = text.match(/\b([A-Z][a-z]{1,30})\b/g) || [];
  const blacklist = new Set(['I','The','A','An','Main','Street','Barbershop','Downtown','Barber','Shop','He','She','They']);
  for (const w of words) {
    if (!blacklist.has(w)) candidates.add(capitalize(w));
  }
  return Array.from(candidates);
}

function capitalize(s) { if (!s) return s; return s[0].toUpperCase() + s.slice(1).toLowerCase(); }

// POST /api/review-candidates/extract/:reviewId
// Runs the extraction (heuristic or LLM) for a single review and stores candidates
router.post('/extract/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  try {
    const rq = await pool.query('SELECT id, text, created_at FROM user_reviews WHERE id = $1 LIMIT 1', [reviewId]);
    if (rq.rowCount === 0) return res.status(404).json({ error: 'review_not_found' });
    const review = rq.rows[0];

    // For now use local heuristic extractor. If you add an LLM integration, replace this.
    const candidates = extractCandidateNames(review.text || '');

    const inserted = [];
    for (const name of candidates) {
      const normalized = name.trim();
      // Try to fuzzy-match a barber: exact match or ILIKE
      const matchQ = await pool.query(
        `SELECT id, name FROM barbers WHERE lower(name) = lower($1) LIMIT 1`, [normalized]
      );
      let matched_barber_id = null;
      let matched_score = null;
      if (matchQ.rowCount) {
        matched_barber_id = matchQ.rows[0].id;
        matched_score = 0.95;
      } else {
        const ilikeQ = await pool.query(
          `SELECT id, name FROM barbers WHERE name ILIKE $1 LIMIT 1`, [`%${normalized}%`]
        );
        if (ilikeQ.rowCount) {
          matched_barber_id = ilikeQ.rows[0].id;
          matched_score = 0.72;
        }
      }

      const insertQ = await pool.query(
        `INSERT INTO review_name_candidates (review_id, candidate_name, normalized_name, confidence, matched_barber_id, matched_score, source)
         VALUES ($1,$2,$3,$4,$5,$6,'heuristic') RETURNING *`,
        [review.id, name, normalized, 0.60, matched_barber_id, matched_score]
      );
      inserted.push(insertQ.rows[0]);
    }

    return res.json({ review_id: review.id, inserted });
  } catch (err) {
    console.error('extract review candidates error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/review-candidates/list?limit=50
router.get('/list', async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  try {
    const q = await pool.query(
      `SELECT rnc.*, ur.text as review_text, b.name as matched_barber_name
       FROM review_name_candidates rnc
       LEFT JOIN user_reviews ur ON ur.id = rnc.review_id
       LEFT JOIN barbers b ON b.id = rnc.matched_barber_id
       ORDER BY rnc.created_at DESC LIMIT $1`, [limit]
    );
    res.json(q.rows);
  } catch (err) {
    console.error('list review candidates error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
