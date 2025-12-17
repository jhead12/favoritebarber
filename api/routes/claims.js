const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /api/claims/claim-profile
// Body: { barber_profile_id, user_id, evidence_url? }
// Creates a claim request and marks claim_status = 'pending'
router.post('/claim-profile', async (req, res) => {
  try {
    const { barber_profile_id, user_id, evidence_url } = req.body || {};
    if (!barber_profile_id || !user_id) return res.status(400).json({ error: 'barber_profile_id and user_id required' });

    const now = new Date().toISOString();
    const q = `UPDATE barber_profiles SET claimed_by_user_id = $1, claim_status = $2, claim_requested_at = $3 WHERE barber_id = $4 RETURNING *`;
    const vals = [user_id, 'pending', now, barber_profile_id];
    const r = await pool.query(q, vals);
    if (!r.rows || r.rows.length === 0) return res.status(404).json({ error: 'barber profile not found' });

    // persist an audit record (optional table) - here we insert into a lightweight table if present
    try {
      await pool.query(`INSERT INTO profile_claims(barber_id, user_id, evidence_url, status, requested_at) VALUES($1,$2,$3,$4,$5)`, [barber_profile_id, user_id, evidence_url || null, 'pending', now]);
    } catch (e) {
      // ignore if table doesn't exist
    }

    return res.json({ success: true, claim: r.rows[0] });
  } catch (e) {
    console.error('claim-profile error', e && e.stack || e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/claims/:barber_id/status
router.get('/:barber_id/status', async (req, res) => {
  try {
    const barber_id = req.params.barber_id;
    const q = `SELECT barber_id, claimed_by_user_id, claim_status, claim_requested_at FROM barber_profiles WHERE barber_id = $1`;
    const r = await pool.query(q, [barber_id]);
    if (!r.rows || r.rows.length === 0) return res.status(404).json({ error: 'barber profile not found' });
    return res.json({ claim: r.rows[0] });
  } catch (e) {
    console.error('claim-status error', e && e.stack || e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
