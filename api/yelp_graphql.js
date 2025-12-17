const { GraphQLClient } = require('graphql-request');
require('dotenv').config();
const { acquireYelpToken } = require('./lib/mcpRateLimiter');
const { CircuitBreaker } = require('./lib/circuitBreaker');
const { costTracker } = require('./lib/costTracker');
const { logExternalCall, logger } = require('./lib/logger');

// Breaker instance for Yelp outbound calls
const yelpBreaker = new CircuitBreaker({ failureThreshold: 5, successThreshold: 2, timeoutMs: Number(process.env.YELP_BREAKER_TIMEOUT_MS || 10000), resetMs: Number(process.env.YELP_BREAKER_RESET_MS || 30000) });

const YELP_GRAPHQL_URL = 'https://api.yelp.com/v3/graphql';
const API_KEY = process.env.YELP_API_KEY || process.env.YELP_API_KEY_TOKEN;
const DEFAULT_TIMEOUT_MS = Number(process.env.YELP_GRAPHQL_TIMEOUT_MS || 8000);
const DEFAULT_RETRIES = Number(process.env.YELP_GRAPHQL_RETRIES || 2);

function redactKey(key) {
  if (!key) return key;
  return `${key.slice(0,4)}...${key.slice(-4)}`;
}

function fetchWithTimeout(resource, options = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const merged = Object.assign({}, options, { signal: controller.signal });
  return fetch(resource, merged).finally(() => clearTimeout(id));
}

async function queryYelpGraphql(queryString, opts = {}) {
  if (!API_KEY) {
    throw new Error('Missing YELP_API_KEY environment variable. Export YELP_API_KEY and retry.');
  }

  const timeout = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const retries = typeof opts.retries === 'number' ? opts.retries : DEFAULT_RETRIES;

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'en_US'
  };

  // Acquire combined Yelp quota (REST + GraphQL) before making the outbound call.
  // callers may pass `opts.accountId` and `opts.cost` (default cost: 1)
  try {
    const accountId = opts.accountId || process.env.YELP_ACCOUNT_ID || 'default';
    const cost = typeof opts.cost === 'number' ? opts.cost : 1;
    const quota = await acquireYelpToken({ accountId, cost });
    if (!quota || !quota.ok) {
      const e = new Error('Yelp quota exceeded');
      e.status = 429; e.quota = quota && quota.quota; e.used = quota && quota.used; throw e;
    }
  } catch (qerr) {
    // If acquireYelpToken throws or returns not-ok, propagate as 429 to callers.
    if (qerr && qerr.status === 429) throw qerr;
    // If Redis failed or another transient error occurred, log and continue to attempt the request
    console.warn('acquireYelpToken error; proceeding without quota enforcement', qerr);
  }

  const client = new GraphQLClient(YELP_GRAPHQL_URL, {
    headers,
    fetch: (url, options) => fetchWithTimeout(url, options, timeout)
  });

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const data = await yelpBreaker.exec(() => logExternalCall({ provider: 'yelp', operation: 'graphql', fn: () => client.request(queryString) }));
      const durationMs = Date.now() - start;
      try { costTracker.record({ provider: 'yelp', model: 'graphql', cost: opts.cost || 1, quotaCost: 1, durationMs, success: true }); } catch (e) { logger.warn({ err: e }, 'costTracker.record failed'); }
      return data;
    } catch (err) {
      lastErr = err;
      try { costTracker.record({ provider: 'yelp', model: 'graphql', cost: opts.cost || 1, quotaCost: 1, durationMs: 0, success: false }); } catch (e) { logger.warn({ err: e }, 'costTracker.record failed'); }
      const status = err && err.response && err.response.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        const body = err.response && err.response.data ? err.response.data : null;
        const e = new Error(`Yelp GraphQL request failed: ${status}`);
        e.status = status; e.body = body; throw e;
      }
      const backoff = 200 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  const e = new Error('Yelp GraphQL request failed after retries');
  e.cause = lastErr;
  throw e;
}

// GraphQL query definitions
const BUSINESS_DETAILS_QUERY = `
  query Business($id: String!) {
    business(id: $id) {
      id
      name
      url
      rating
      review_count
      price
      photos
      hours {
        open {
          day
          start
          end
        }
      }
      categories {
        title
        alias
      }
      location {
        address1
        address2
        address3
        city
        state
        zip_code
        country
      }
      coordinates {
        latitude
        longitude
      }
    }
  }
`;

const REVIEWS_QUERY = `
  query BusinessReviews($id: String!, $limit: Int, $offset: Int) {
    business(id: $id) {
      reviews(limit: $limit, offset: $offset) {
        total
        review {
          id
          text
          rating
          time_created
          user {
            id
            name
            image_url
          }
        }
      }
    }
  }
`;

/**
 * Fetch business details via GraphQL
 * @param {string} yelpId - Yelp business ID
 * @param {object} opts - Options (accountId, cost, timeoutMs, retries)
 * @returns {Promise<object>} Raw GraphQL business payload
 */
async function fetchBusinessDetails(yelpId, opts = {}) {
  if (!yelpId) throw new Error('yelpId is required');
  const variables = { id: yelpId };
  const result = await queryYelpGraphql(BUSINESS_DETAILS_QUERY, { ...opts, variables });
  return result.business || null;
}

/**
 * Fetch business reviews via GraphQL (with pagination)
 * @param {string} yelpId - Yelp business ID
 * @param {object} opts - Options (limit, offset, accountId, cost, timeoutMs, retries)
 * @returns {Promise<object>} { total, reviews: [...] }
 */
async function fetchBusinessReviews(yelpId, opts = {}) {
  if (!yelpId) throw new Error('yelpId is required');
  const limit = opts.limit || 20;
  const offset = opts.offset || 0;
  const variables = { id: yelpId, limit, offset };
  const result = await queryYelpGraphql(REVIEWS_QUERY, { ...opts, variables });
  if (!result.business || !result.business.reviews) {
    return { total: 0, reviews: [] };
  }
  return {
    total: result.business.reviews.total || 0,
    reviews: result.business.reviews.review || []
  };
}

module.exports = { 
  queryYelpGraphql, 
  fetchBusinessDetails, 
  fetchBusinessReviews,
  BUSINESS_DETAILS_QUERY,
  REVIEWS_QUERY
};
