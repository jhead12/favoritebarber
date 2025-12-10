const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const os = require('os');
const path = require('path');
const { parseUploadFile } = require('../lib/ingestUpload');
const { verifyCandidate } = require('../lib/llmVerifier');
const { createCandidate } = require('../models/socialProfile');

const upload = multer({ dest: path.join(os.tmpdir(), 'ryb-uploads') });

// GET /api/admin/data-status
router.get('/data-status', async (req, res) => {
  try {
    const countsQ = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM barbers) AS barbers_count,
        (SELECT COUNT(*) FROM shops) AS shops_count,
        (SELECT COUNT(*) FROM locations) AS locations_count,
        (SELECT COUNT(*) FROM images) AS images_count,
        (SELECT COUNT(*) FROM reviews) AS reviews_count
    `);

    const aggQ = await pool.query(`
      SELECT
        AVG(COALESCE(b.trust_score,0))::float AS avg_barber_trust,
        AVG(COALESCE(s.trust_score,0))::float AS avg_shop_trust
      FROM barbers b LEFT JOIN shops s ON true LIMIT 1
    `);

    // percentage of verified locations
    const verifiedQ = await pool.query(`SELECT 100.0 * SUM(CASE WHEN verified THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct_locations_verified FROM locations`);

    const counts = countsQ.rows[0] || {};
    const aggs = aggQ.rows[0] || {};
    const verified = verifiedQ.rows[0] || { pct_locations_verified: 0 };

    // simple distribution buckets for barber trust
    const distrQ = await pool.query(`
      SELECT
        SUM(CASE WHEN trust_score < 20 THEN 1 ELSE 0 END) AS lt20,
        SUM(CASE WHEN trust_score >= 20 AND trust_score < 40 THEN 1 ELSE 0 END) AS bt20_40,
        SUM(CASE WHEN trust_score >= 40 AND trust_score < 60 THEN 1 ELSE 0 END) AS bt40_60,
        SUM(CASE WHEN trust_score >= 60 AND trust_score < 80 THEN 1 ELSE 0 END) AS bt60_80,
        SUM(CASE WHEN trust_score >= 80 THEN 1 ELSE 0 END) AS gte80
      FROM barbers
    `);

    const distr = distrQ.rows[0] || {};

    res.json({ counts, aggs, verified, distr });
  } catch (e) {
    console.error('admin data-status error', e);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;

// POST /api/admin/upload-profiles
// Protect upload endpoint: allow admin API key OR admin JWT
router.post('/upload-profiles', requireAdminOrAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no_file' });
    const filePath = req.file.path;
    const candidates = await parseUploadFile(filePath);
    const results = [];
    for (const c of candidates) {
      const verification = await verifyCandidate(c);
      // normalize a few candidate outputs and persist top-level evidence entries
      const evidence = { heuristic: verification.heuristic, llm: verification.llm };
      // try to pick a platform/handle/url from evidence
      let platform = null, handle = null, profile_url = null;
      if (verification.heuristic && verification.heuristic.evidence && verification.heuristic.evidence.length) {
        const lead = verification.heuristic.evidence[0];
        platform = lead.platform || null;
        profile_url = lead.url || null;
      }
      if (c.handles && c.handles.length) handle = c.handles[0];

      const created = await createCandidate({ platform, handle, profile_url, name: c.name || null, evidence, confidence: verification.heuristic.confidence || 0, source: 'upload' });
      results.push({ candidate: c, verification, created });
    }
    res.json({ uploaded: req.file.originalname, count: results.length, results });
  } catch (e) {
    console.error('upload-profiles error', e);
    res.status(500).json({ error: 'server_error' });
  }
});
