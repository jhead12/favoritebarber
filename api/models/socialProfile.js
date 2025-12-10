const { pool } = require('../db');

async function createCandidate({ platform, handle, profile_url, name, evidence, confidence, source }) {
  const q = `INSERT INTO social_profiles (platform, handle, profile_url, name, evidence, confidence, source, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now()) RETURNING *`;
  const vals = [platform || null, handle || null, profile_url || null, name || null, evidence || {}, confidence || 0, source || 'upload'];
  const res = await pool.query(q, vals);
  return res.rows[0];
}

module.exports = { createCandidate };
