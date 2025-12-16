const axios = require('axios');
require('dotenv').config();

const YELP_GRAPHQL_URL = 'https://api.yelp.com/v3/graphql';
const API_KEY = process.env.YELP_API_KEY || process.env.YELP_API_KEY_TOKEN;
const DEFAULT_TIMEOUT_MS = Number(process.env.YELP_GRAPHQL_TIMEOUT_MS || 8000);
const DEFAULT_RETRIES = Number(process.env.YELP_GRAPHQL_RETRIES || 2);

function redactKey(key) {
  if (!key) return key;
  return `${key.slice(0,4)}...${key.slice(-4)}`;
}

async function queryYelpGraphql(queryString, opts = {}) {
  if (!API_KEY) {
    throw new Error('Missing YELP_API_KEY environment variable. Export YELP_API_KEY and retry.');
  }

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/graphql'
  };

  const timeout = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  const retries = typeof opts.retries === 'number' ? opts.retries : DEFAULT_RETRIES;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(YELP_GRAPHQL_URL, queryString, { headers, timeout });
      // GraphQL may return 200 with errors[]
      if (res && res.data) {
        if (res.data.errors && res.data.errors.length > 0) {
          // Return the body so callers can decide, but include error list
          return { data: res.data.data || null, errors: res.data.errors };
        }
        return res.data;
      }
      return res;
    } catch (err) {
      lastErr = err;
      const status = err && err.response && err.response.status;
      // Do not retry on 4xx except 429
      if (status && status >= 400 && status < 500 && status !== 429) {
        // attach any response body if present
        const body = err.response && err.response.data ? err.response.data : null;
        const e = new Error(`Yelp GraphQL request failed: ${status}`);
        e.status = status; e.body = body; throw e;
      }
      // transient: wait exponential backoff
      const backoff = 200 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  const e = new Error('Yelp GraphQL request failed after retries');
  e.cause = lastErr;
  throw e;
}

module.exports = { queryYelpGraphql };
