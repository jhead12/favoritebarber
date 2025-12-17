/**
 * MCP Webhooks Module
 * 
 * Handles webhook subscription management and delivery with HMAC signing.
 */

const crypto = require('crypto');
const db = require('../db');
const { logger } = require('./logger');

/**
 * Generate webhook secret for HMAC signing
 */
function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Sign webhook payload with HMAC-SHA256
 * 
 * @param {string} payload - JSON stringified payload
 * @param {string} secret - Webhook secret
 * @returns {string} - Signature in format: v1,<timestamp>,<signature>
 */
function signPayload(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `v1,${timestamp},${signature}`;
}

/**
 * Verify webhook signature
 * 
 * @param {string} payload - JSON stringified payload
 * @param {string} signature - Signature header value
 * @param {string} secret - Webhook secret
 * @param {number} tolerance - Max age in seconds (default: 300 = 5 min)
 * @returns {boolean}
 */
function verifySignature(payload, signature, secret, tolerance = 300) {
  try {
    const parts = signature.split(',');
    if (parts[0] !== 'v1' || parts.length !== 3) return false;

    const timestamp = parseInt(parts[1], 10);
    const receivedSig = parts[2];

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) return false;

    // Recompute signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    );

  } catch (err) {
    logger.error({ err }, 'Webhook signature verification failed');
    return false;
  }
}

/**
 * Create webhook subscription
 * 
 * @param {number} partnerId - Partner ID
 * @param {string} url - Webhook endpoint URL
 * @param {string[]} events - Event types to subscribe to
 * @returns {Promise<object>} - Webhook record with secret
 */
async function createWebhookSubscription(partnerId, url, events) {
  const secret = generateWebhookSecret();

  try {
    const result = await db.query(`
      INSERT INTO mcp_webhooks (partner_id, url, events, secret, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
      RETURNING *
    `, [partnerId, url, events, secret]);

    logger.info({ 
      partner_id: partnerId, 
      webhook_id: result.rows[0].id,
      events 
    }, 'Webhook subscription created');

    return {
      id: result.rows[0].id,
      url: result.rows[0].url,
      events: result.rows[0].events,
      secret: result.rows[0].secret, // Return once
      status: result.rows[0].status,
      created_at: result.rows[0].created_at
    };

  } catch (err) {
    logger.error({ err, partner_id: partnerId }, 'Failed to create webhook');
    throw err;
  }
}

/**
 * Dispatch webhook event (enqueue for delivery)
 * 
 * @param {number} webhookId - Webhook subscription ID
 * @param {string} eventType - Event type (e.g., 'discovery.completed')
 * @param {object} payload - Event payload
 */
async function dispatchWebhook(webhookId, eventType, payload) {
  try {
    await db.query(`
      INSERT INTO mcp_webhook_deliveries (webhook_id, event_type, payload, status, attempts, created_at, next_retry_at)
      VALUES ($1, $2, $3, 'pending', 0, NOW(), NOW())
    `, [webhookId, eventType, JSON.stringify(payload)]);

    logger.info({ webhook_id: webhookId, event_type: eventType }, 'Webhook delivery enqueued');

  } catch (err) {
    logger.error({ err, webhook_id: webhookId }, 'Failed to enqueue webhook delivery');
    throw err;
  }
}

/**
 * Deliver webhook (called by webhook dispatcher worker)
 * 
 * @param {object} delivery - Delivery record from mcp_webhook_deliveries
 * @param {string} webhookUrl - Webhook URL
 * @param {string} secret - Webhook secret
 * @returns {Promise<object>} - Delivery result
 */
async function deliverWebhook(delivery, webhookUrl, secret) {
  const fetch = global.fetch || require('node-fetch');
  const payloadStr = JSON.stringify(delivery.payload);
  const signature = signPayload(payloadStr, secret);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Id': delivery.id.toString(),
        'X-Event-Type': delivery.event_type
      },
      body: payloadStr,
      timeout: 10000 // 10 second timeout
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await db.query(`
        UPDATE mcp_webhook_deliveries
        SET status = 'delivered', delivered_at = NOW(), response_code = $1, response_body = $2
        WHERE id = $3
      `, [response.status, responseBody.slice(0, 1000), delivery.id]);

      // Update webhook last_success_at
      await db.query(`
        UPDATE mcp_webhooks
        SET last_success_at = NOW(), failure_count = 0
        WHERE id = $1
      `, [delivery.webhook_id]);

      logger.info({ 
        delivery_id: delivery.id, 
        webhook_id: delivery.webhook_id,
        status_code: response.status 
      }, 'Webhook delivered successfully');

      return { success: true, statusCode: response.status };

    } else {
      // HTTP error
      throw new Error(`HTTP ${response.status}: ${responseBody.slice(0, 200)}`);
    }

  } catch (err) {
    // Delivery failed - schedule retry with exponential backoff
    const newAttempts = delivery.attempts + 1;
    const backoffMinutes = Math.min(60, Math.pow(2, newAttempts)); // Max 60 min
    const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

    await db.query(`
      UPDATE mcp_webhook_deliveries
      SET status = 'failed', attempts = $1, response_code = $2, response_body = $3, next_retry_at = $4
      WHERE id = $5
    `, [newAttempts, null, err.message.slice(0, 1000), nextRetry, delivery.id]);

    // Update webhook failure tracking
    await db.query(`
      UPDATE mcp_webhooks
      SET last_failure_at = NOW(), failure_count = failure_count + 1
      WHERE id = $1
    `, [delivery.webhook_id]);

    logger.warn({ 
      delivery_id: delivery.id,
      webhook_id: delivery.webhook_id,
      attempts: newAttempts,
      next_retry: nextRetry,
      error: err.message 
    }, 'Webhook delivery failed, scheduled retry');

    return { success: false, error: err.message, nextRetry };
  }
}

module.exports = {
  generateWebhookSecret,
  signPayload,
  verifySignature,
  createWebhookSubscription,
  dispatchWebhook,
  deliverWebhook
};
