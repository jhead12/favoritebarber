/**
 * MCP Authentication Middleware
 * 
 * Database-backed API key validation with bcrypt hashing, scope enforcement,
 * and partner context attachment.
 */

const db = require('../db');
const bcrypt = require('bcrypt');
const { logger } = require('../lib/logger');

/**
 * Authenticate MCP requests using Bearer token
 * 
 * Expects header: Authorization: Bearer ryb_live_abc123xyz456
 * 
 * Attaches to req:
 * - req.mcp_partner: Partner object from database
 * - req.mcp_api_key: API key record
 */
async function authenticateMCP(req, res, next) {
  try {
    // Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'missing_auth',
          message: 'Missing Authorization header. Expected: Authorization: Bearer ryb_...'
        }
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Validate key format (ryb_test_... or ryb_live_...)
    if (!apiKey.startsWith('ryb_test_') && !apiKey.startsWith('ryb_live_')) {
      return res.status(401).json({
        error: {
          code: 'invalid_key_format',
          message: 'API key must start with ryb_test_ or ryb_live_'
        }
      });
    }

    // Get key prefix for lookup (first 16 chars)
    const keyPrefix = apiKey.substring(0, 16);

    // Find API key by prefix
    const keyResult = await db.query(`
      SELECT 
        ak.*,
        p.id as partner_id,
        p.name as partner_name,
        p.tier,
        p.status as partner_status,
        p.scopes,
        p.rate_limit_per_minute,
        p.quota_per_day
      FROM mcp_api_keys ak
      JOIN mcp_partners p ON ak.partner_id = p.id
      WHERE ak.key_prefix = $1
        AND ak.status = 'active'
        AND p.status = 'active'
    `, [keyPrefix]);

    if (keyResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'invalid_key',
          message: 'Invalid or revoked API key'
        }
      });
    }

    const keyRecord = keyResult.rows[0];

    // Verify key hash (compare full key against stored bcrypt hash)
    const isValid = await bcrypt.compare(apiKey, keyRecord.key_hash);
    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'invalid_key',
          message: 'Invalid API key'
        }
      });
    }

    // Check if key is expired
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: {
          code: 'key_expired',
          message: 'API key has expired',
          expired_at: keyRecord.expires_at
        }
      });
    }

    // Update last_used_at and usage_count (async, don't wait)
    db.query(`
      UPDATE mcp_api_keys
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE id = $1
    `, [keyRecord.id]).catch(err => {
      logger.error({ err, key_id: keyRecord.id }, 'Failed to update API key usage');
    });

    // Attach partner context to request
    req.mcp_partner = {
      id: keyRecord.partner_id,
      name: keyRecord.partner_name,
      tier: keyRecord.tier,
      scopes: keyRecord.scopes || [],
      rate_limit_per_minute: keyRecord.rate_limit_per_minute,
      quota_per_day: keyRecord.quota_per_day
    };

    req.mcp_api_key = {
      id: keyRecord.id,
      prefix: keyRecord.key_prefix,
      environment: keyRecord.environment
    };

      // Backwards-compatible `req.mcp` shape expected by some routes/middleware
      req.mcp = {
        partnerId: req.mcp_partner.id,
        apiKey: req.mcp_api_key.id,
        rate_limit_per_minute: req.mcp_partner.rate_limit_per_minute,
        quota_per_day: req.mcp_partner.quota_per_day,
        scopes: req.mcp_partner.scopes
      };

    logger.info({
      partner_id: req.mcp_partner.id,
      partner_name: req.mcp_partner.name,
      key_id: req.mcp_api_key.id
    }, 'MCP request authenticated');

    next();

  } catch (error) {
    logger.error({ err: error }, 'MCP authentication error');
    return res.status(500).json({
      error: {
        code: 'auth_error',
        message: 'Internal authentication error'
      }
    });
  }
}

/**
 * Middleware to require specific scopes
 * 
 * Usage:
 *   router.get('/mcp/v1/live/barbers/:id', authenticateMCP, requireScope('read:live_yelp'), ...)
 * 
 * @param {string|string[]} requiredScopes - Scope or array of scopes (OR logic)
 */
function requireScope(requiredScopes) {
  const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];

  return (req, res, next) => {
    if (!req.mcp_partner) {
      return res.status(401).json({
        error: {
          code: 'not_authenticated',
          message: 'Authentication required. Use authenticateMCP middleware first.'
        }
      });
    }

    const partnerScopes = req.mcp_partner.scopes || [];
    const hasScope = scopes.some(scope => partnerScopes.includes(scope));

    if (!hasScope) {
      return res.status(403).json({
        error: {
          code: 'insufficient_scope',
          message: `This endpoint requires one of the following scopes: ${scopes.join(', ')}`,
          required_scopes: scopes,
          your_scopes: partnerScopes
        }
      });
    }

    logger.info({
      partner_id: req.mcp_partner.id,
      required_scopes: scopes,
      partner_scopes: partnerScopes
    }, 'Scope check passed');

    next();
  };
}

/**
 * Generate a new API key for a partner
 * 
 * @param {number} partnerId - Partner ID
 * @param {string} environment - 'test' or 'live'
 * @param {string} name - Optional human-readable name
 * @returns {Object} { key (plaintext, show once), keyRecord }
 */
async function generateAPIKey(partnerId, environment = 'test', name = null) {
  // Generate random key: ryb_{env}_{32 random chars}
  const randomPart = require('crypto').randomBytes(16).toString('hex');
  const key = `ryb_${environment}_${randomPart}`;
  const keyPrefix = key.substring(0, 16); // 'ryb_test_abc123x'

  // Hash the key
  const keyHash = await bcrypt.hash(key, 10);

  // Insert into database
  const result = await db.query(`
    INSERT INTO mcp_api_keys (partner_id, key_hash, key_prefix, name, environment, status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING *
  `, [partnerId, keyHash, keyPrefix, name, environment]);

  const keyRecord = result.rows[0];

  logger.info({
    partner_id: partnerId,
    key_id: keyRecord.id,
    key_prefix: keyPrefix,
    environment
  }, 'API key generated');

  return {
    key, // Return plaintext key ONCE (never stored)
    id: keyRecord.id,
    keyRecord
  };
}

/**
 * Revoke an API key
 * 
 * @param {number} keyId - API key ID
 * @param {string} reason - Reason for revocation
 */
async function revokeAPIKey(keyId, reason = 'Manual revocation') {
  await db.query(`
    UPDATE mcp_api_keys
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = $1
    WHERE id = $2
  `, [reason, keyId]);

  logger.info({ key_id: keyId, reason }, 'API key revoked');
}

module.exports = {
  authenticateMCP,
  requireScope,
  generateAPIKey,
  revokeAPIKey,
  // Legacy compatibility
  requireMcpAuth: authenticateMCP
};

