#!/usr/bin/env node
/**
 * Webhook Delivery Worker
 * 
 * Polls mcp_webhook_deliveries table and delivers pending webhooks with retry logic.
 */

const { pool } = require('../api/db');
const { deliverWebhook } = require('../api/lib/mcpWebhooks');
const { logger } = require('../api/lib/logger');

async function fetchPendingDeliveries(limit = 5) {
  const result = await pool.query(`
    SELECT 
      wd.*,
      w.url as webhook_url,
      w.secret as webhook_secret,
      w.partner_id
    FROM mcp_webhook_deliveries wd
    JOIN mcp_webhooks w ON wd.webhook_id = w.id
    WHERE wd.status = 'pending' 
      OR (wd.status = 'failed' AND wd.attempts < 5 AND wd.next_retry_at <= NOW())
    ORDER BY wd.next_retry_at ASC
    LIMIT $1
  `, [limit]);

  return result.rows || [];
}

async function processDelivery(delivery) {
  logger.info({ 
    delivery_id: delivery.id,
    webhook_id: delivery.webhook_id,
    event_type: delivery.event_type,
    attempts: delivery.attempts 
  }, 'Processing webhook delivery');

  try {
    await deliverWebhook(delivery, delivery.webhook_url, delivery.webhook_secret);
  } catch (err) {
    logger.error({ 
      err, 
      delivery_id: delivery.id 
    }, 'Webhook delivery processing failed');
  }
}

async function loop() {
  logger.info('Webhook dispatcher started');

  while (true) {
    try {
      const deliveries = await fetchPendingDeliveries(5);

      if (deliveries.length === 0) {
        // No pending deliveries - wait 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      // Process deliveries sequentially (could parallelize with Promise.all if needed)
      for (const delivery of deliveries) {
        await processDelivery(delivery);
        // Small delay between deliveries
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (err) {
      logger.error({ err }, 'Webhook dispatcher error');
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s on error
    }
  }
}

// Auto-disable webhooks after too many failures
async function disableFailedWebhooks() {
  try {
    const result = await pool.query(`
      UPDATE mcp_webhooks
      SET status = 'failed'
      WHERE status = 'active' 
        AND failure_count >= 10
        AND (last_success_at IS NULL OR last_success_at < NOW() - INTERVAL '7 days')
      RETURNING id, partner_id, url
    `);

    if (result.rows.length > 0) {
      logger.warn({ 
        count: result.rows.length,
        webhooks: result.rows 
      }, 'Disabled webhooks due to repeated failures');
    }

  } catch (err) {
    logger.error({ err }, 'Failed to disable failed webhooks');
  }
}

// Run cleanup every hour
setInterval(() => {
  disableFailedWebhooks().catch(err => {
    logger.error({ err }, 'Cleanup task failed');
  });
}, 3600000); // 1 hour

if (require.main === module) {
  loop().catch(err => {
    logger.error({ err }, 'Webhook dispatcher fatal error');
    process.exit(1);
  });
}

module.exports = { fetchPendingDeliveries, processDelivery };
