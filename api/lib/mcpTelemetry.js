/**
 * MCP Telemetry Middleware
 * 
 * Logs all MCP API requests to mcp_request_logs table and
 * tracks response times, status codes, and Yelp API usage.
 */

const { randomUUID } = require('crypto');
const db = require('../db');
const { logger } = require('./logger');

/**
 * Generate X-Request-ID header for request correlation
 * Uses high-resolution timestamp + UUID for uniqueness under high concurrency
 */
function generateRequestId() {
  const hrTime = process.hrtime.bigint(); // Nanosecond precision
  const uuid = randomUUID().slice(0, 8);
  return `req_${hrTime}_${uuid}`;
}

/**
 * Telemetry middleware - logs request metadata
 * Should be placed after authenticateMCP but before route handlers
 */
function mcpTelemetryMiddleware(req, res, next) {
  // Generate request ID for correlation
  const requestId = generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Capture request start time
  const startTime = Date.now();

  // Track Yelp API calls made during this request
  req.yelp_calls = 0;
  req.yelp_cost_estimate = 0;

  // Log request only once when response finishes
  // Using 'finish' event is more reliable than wrapping methods
  // because it fires once per response regardless of which method was used
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;

    // Extract partner info from req.mcp_partner (set by authenticateMCP)
    const partnerId = req.mcp_partner?.id || null;
    const apiKeyId = req.mcp_api_key?.id || null;

    try {
      await db.query(`
        INSERT INTO mcp_request_logs 
        (partner_id, api_key_id, request_id, method, endpoint, query_params, 
         status_code, response_time_ms, yelp_calls, yelp_cost_estimate_usd,
         user_agent, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        partnerId,
        apiKeyId,
        requestId,
        req.method,
        req.path,
        req.query ? JSON.stringify(req.query) : null,
        res.statusCode,
        responseTime,
        req.yelp_calls || 0,
        req.yelp_cost_estimate || 0,
        req.headers['user-agent'] || null,
        req.ip || req.headers['x-forwarded-for'] || null
      ]);

      logger.info({
        request_id: requestId,
        partner_id: partnerId,
        method: req.method,
        endpoint: req.path,
        status_code: res.statusCode,
        response_time_ms: responseTime,
        yelp_calls: req.yelp_calls || 0
      }, 'MCP request logged');

    } catch (err) {
      logger.error({ err, request_id: requestId }, 'Failed to log MCP request');
    }
  });

  next();
}

/**
 * Helper to track Yelp API calls within a request
 * Call this whenever making a Yelp API/GraphQL call
 * 
 * @param {object} req - Express request object
 * @param {number} calls - Number of Yelp calls made
 * @param {number} estimatedCost - Estimated cost in USD
 */
function trackYelpCall(req, calls = 1, estimatedCost = 0.0001) {
  if (!req) return;
  req.yelp_calls = (req.yelp_calls || 0) + calls;
  req.yelp_cost_estimate = (req.yelp_cost_estimate || 0) + estimatedCost;
}

module.exports = {
  mcpTelemetryMiddleware,
  generateRequestId,
  trackYelpCall
};
