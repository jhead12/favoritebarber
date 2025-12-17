const { GraphQLClient } = require('graphql-request');
require('dotenv').config();
const { acquireYelpToken } = require('./lib/mcpRateLimiter');

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
    'Content-Type': 'application/json'
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
      const data = await client.request(queryString);
      return data;
    } catch (err) {
      lastErr = err;
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

module.exports = { queryYelpGraphql };
