/**
 * Partner Admin API Routes
 * 
 * Admin-only endpoints for managing MCP partners, API keys, and quotas.
 * Requires authentication and admin privileges.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../db');
const { generateAPIKey, revokeAPIKey } = require('../../middleware/mcpAuth');
const { logger } = require('../../lib/logger');

// Middleware to require admin privileges
// TODO: Replace with actual admin auth middleware
function requireAdmin(req, res, next) {
  // For now, check if user has admin scope in mcp_partner context
  if (req.mcp_partner && req.mcp_partner.tier === 'internal') {
    return next();
  }
  
  res.status(403).json({ 
    error: 'admin_required',
    message: 'Admin privileges required' 
  });
}

// GET /api/admin/partners - List all partners
router.get('/', requireAdmin, async (req, res) => {
  const { status, tier, limit = 50, offset = 0 } = req.query;
  
  try {
    let query = 'SELECT * FROM mcp_partners WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tier) {
      query += ` AND tier = $${paramIndex}`;
      params.push(tier);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    res.json({
      partners: result.rows,
      count: result.rows.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

  } catch (err) {
    logger.error({ err }, 'Failed to list partners');
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/admin/partners/:id - Get partner details
router.get('/:id', requireAdmin, async (req, res) => {
  const partnerId = parseInt(req.params.id, 10);

  if (isNaN(partnerId)) {
    return res.status(400).json({ error: 'invalid_partner_id' });
  }

  try {
    const partnerResult = await pool.query(
      'SELECT * FROM mcp_partners WHERE id = $1',
      [partnerId]
    );

    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'partner_not_found' });
    }

    // Get partner's API keys
    const keysResult = await pool.query(
      'SELECT id, key_prefix, name, environment, status, last_used_at, usage_count, created_at FROM mcp_api_keys WHERE partner_id = $1 ORDER BY created_at DESC',
      [partnerId]
    );

    // Get recent quota usage
    const quotaResult = await pool.query(
      'SELECT * FROM mcp_quota_usage WHERE partner_id = $1 ORDER BY date DESC LIMIT 30',
      [partnerId]
    );

    res.json({
      partner: partnerResult.rows[0],
      api_keys: keysResult.rows,
      quota_usage: quotaResult.rows
    });

  } catch (err) {
    logger.error({ err, partner_id: partnerId }, 'Failed to get partner');
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/admin/partners - Create new partner
router.post('/', requireAdmin, async (req, res) => {
  const {
    name,
    company,
    email,
    tier = 'free',
    scopes = ['read:barbers', 'read:reviews'],
    rate_limit_per_minute = 60,
    quota_per_day = 10000,
    monthly_price_usd = 0,
    notes
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ 
      error: 'missing_required_fields',
      message: 'name and email are required' 
    });
  }

  try {
    const result = await pool.query(`
      INSERT INTO mcp_partners 
      (name, company, email, tier, scopes, rate_limit_per_minute, quota_per_day, monthly_price_usd, notes, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW())
      RETURNING *
    `, [
      name,
      company || null,
      email,
      tier,
      JSON.stringify(scopes),
      rate_limit_per_minute,
      quota_per_day,
      monthly_price_usd,
      notes || null
    ]);

    logger.info({ partner_id: result.rows[0].id }, 'Partner created');

    res.status(201).json({
      partner: result.rows[0],
      message: 'Partner created successfully'
    });

  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ 
        error: 'email_exists',
        message: 'A partner with this email already exists' 
      });
    }

    logger.error({ err }, 'Failed to create partner');
    res.status(500).json({ error: 'internal_error' });
  }
});

// PATCH /api/admin/partners/:id - Update partner
router.patch('/:id', requireAdmin, async (req, res) => {
  const partnerId = parseInt(req.params.id, 10);

  if (isNaN(partnerId)) {
    return res.status(400).json({ error: 'invalid_partner_id' });
  }

  const allowedFields = [
    'name', 'company', 'email', 'tier', 'status', 'scopes',
    'rate_limit_per_minute', 'quota_per_day', 'monthly_price_usd',
    'billing_email', 'notes'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ 
      error: 'no_fields_to_update',
      message: 'Provide at least one field to update' 
    });
  }

  try {
    // Build SET clause
    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    const query = `
      UPDATE mcp_partners 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const params = [partnerId, ...Object.values(updates)];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'partner_not_found' });
    }

    logger.info({ partner_id: partnerId, fields: Object.keys(updates) }, 'Partner updated');

    res.json({
      partner: result.rows[0],
      message: 'Partner updated successfully'
    });

  } catch (err) {
    logger.error({ err, partner_id: partnerId }, 'Failed to update partner');
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/admin/partners/:id/keys - Generate new API key
router.post('/:id/keys', requireAdmin, async (req, res) => {
  const partnerId = parseInt(req.params.id, 10);
  const { environment = 'test', name } = req.body;

  if (isNaN(partnerId)) {
    return res.status(400).json({ error: 'invalid_partner_id' });
  }

  if (!['test', 'live'].includes(environment)) {
    return res.status(400).json({ 
      error: 'invalid_environment',
      message: 'environment must be "test" or "live"' 
    });
  }

  try {
    const keyData = await generateAPIKey(partnerId, environment, name);

    res.status(201).json({
      api_key: keyData.key,
      key_id: keyData.id,
      key_prefix: keyData.keyRecord.key_prefix,
      environment: keyData.keyRecord.environment,
      message: 'API key generated. Store this key securely - it will not be shown again.',
      warning: 'The full API key is only shown once. Make sure to save it now.'
    });

  } catch (err) {
    logger.error({ err, partner_id: partnerId }, 'Failed to generate API key');
    res.status(500).json({ error: 'internal_error' });
  }
});

// DELETE /api/admin/partners/:partnerId/keys/:keyId - Revoke API key
router.delete('/:partnerId/keys/:keyId', requireAdmin, async (req, res) => {
  const partnerId = parseInt(req.params.partnerId, 10);
  const keyId = parseInt(req.params.keyId, 10);
  const { reason = 'Revoked by admin' } = req.body;

  if (isNaN(partnerId) || isNaN(keyId)) {
    return res.status(400).json({ error: 'invalid_ids' });
  }

  try {
    await revokeAPIKey(keyId, reason);

    res.json({
      message: 'API key revoked successfully',
      key_id: keyId,
      reason
    });

  } catch (err) {
    logger.error({ err, partner_id: partnerId, key_id: keyId }, 'Failed to revoke API key');
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
