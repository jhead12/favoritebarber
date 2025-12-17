// Compatibility shim: export the middleware expected by older imports
// The real implementation lives in `mcpRateLimiter.js`.
const limiter = require('./mcpRateLimiter');

// Export the named symbol `mcpRateLimitMiddleware` as expected by code that
// imports from './lib/mcpRateLimitMiddleware'. Also re-export helpers.
module.exports = {
  mcpRateLimitMiddleware: limiter.mcpRateLimitMiddleware || limiter.rateLimitMiddleware || limiter.mcpRateLimiter,
  checkRateLimit: limiter.checkRateLimit,
  getRateLimitStatus: limiter.getRateLimitStatus,
  resetRateLimit: limiter.resetRateLimit,
};
