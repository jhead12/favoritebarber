/**
 * MCP Quota Aggregation Job
 * 
 * Cron job that aggregates mcp_request_logs into daily mcp_quota_usage records.
 * Run once per day (e.g., at midnight) to compute daily metrics per partner.
 */

const db = require('../db');
const { logger } = require('../lib/logger');

async function aggregateQuotaUsage() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  logger.info({ date: dateStr }, 'Starting MCP quota aggregation');

  try {
    // Aggregate yesterday's request logs per partner
    const result = await db.query(`
      INSERT INTO mcp_quota_usage (
        partner_id, date, 
        requests_total, requests_success, requests_error,
        yelp_calls_total, yelp_cost_total_usd,
        avg_response_time_ms, p95_response_time_ms,
        created_at, updated_at
      )
      SELECT 
        partner_id,
        DATE(created_at) as date,
        COUNT(*) as requests_total,
        COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as requests_success,
        COUNT(*) FILTER (WHERE status_code >= 400) as requests_error,
        COALESCE(SUM(yelp_calls), 0) as yelp_calls_total,
        COALESCE(SUM(yelp_cost_estimate_usd), 0) as yelp_cost_total_usd,
        ROUND(AVG(response_time_ms)) as avg_response_time_ms,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)) as p95_response_time_ms,
        NOW() as created_at,
        NOW() as updated_at
      FROM mcp_request_logs
      WHERE DATE(created_at) = $1
        AND partner_id IS NOT NULL
      GROUP BY partner_id, DATE(created_at)
      ON CONFLICT (partner_id, date) 
      DO UPDATE SET
        requests_total = EXCLUDED.requests_total,
        requests_success = EXCLUDED.requests_success,
        requests_error = EXCLUDED.requests_error,
        yelp_calls_total = EXCLUDED.yelp_calls_total,
        yelp_cost_total_usd = EXCLUDED.yelp_cost_total_usd,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        p95_response_time_ms = EXCLUDED.p95_response_time_ms,
        updated_at = NOW()
    `, [dateStr]);

    logger.info({
      date: dateStr,
      rows_affected: result.rowCount
    }, 'MCP quota aggregation completed');

    return { success: true, date: dateStr, rowsAffected: result.rowCount };

  } catch (err) {
    logger.error({ err, date: dateStr }, 'MCP quota aggregation failed');
    throw err;
  }
}

/**
 * Clean up old request logs (optional - keep last 30 days)
 */
async function cleanupOldLogs(retentionDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  try {
    const result = await db.query(`
      DELETE FROM mcp_request_logs
      WHERE created_at < $1
    `, [cutoffStr]);

    logger.info({
      cutoff_date: cutoffStr,
      rows_deleted: result.rowCount
    }, 'Old MCP request logs cleaned up');

    return { success: true, rowsDeleted: result.rowCount };

  } catch (err) {
    logger.error({ err, cutoff_date: cutoffStr }, 'Log cleanup failed');
    throw err;
  }
}

// If run directly, execute aggregation
if (require.main === module) {
  (async () => {
    try {
      await aggregateQuotaUsage();
      await cleanupOldLogs(30);
      process.exit(0);
    } catch (err) {
      console.error('Quota aggregation failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  aggregateQuotaUsage,
  cleanupOldLogs
};
