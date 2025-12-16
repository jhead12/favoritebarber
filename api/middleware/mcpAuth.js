// Simple MCP auth middleware
// Expects environment variable MCP_API_KEYS as a JSON object mapping apiKey -> { partnerId, scopes }
// Example: export MCP_API_KEYS='{"key1":{"partnerId":"acme","scopes":["read:bars","read:live_yelp"]}}'
const parseKeys = () => {
  const raw = process.env.MCP_API_KEYS || '{}';
  try {
    const obj = JSON.parse(raw);
    return obj;
  } catch (err) {
    console.warn('MCP_AUTH: failed to parse MCP_API_KEYS, expecting JSON. Falling back to empty map.');
    return {};
  }
};

const keys = parseKeys();

// If no keys are configured and a dev flag is set, allow a default dev key 'dev' for local testing
if (Object.keys(keys).length === 0 && process.env.NODE_ENV !== 'production') {
  // allow a `dev` key for local development when no keys are configured
  keys['dev'] = { partnerId: 'local-dev', scopes: ['read:bars', 'read:live_yelp'] };
}

function extractApiKey(req) {
  const auth = req.headers['authorization'];
  if (auth && typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1];
  }
  const headerKey = req.headers['x-api-key'] || req.query.api_key;
  if (headerKey) return headerKey;
  return null;
}

function requireMcpAuth(req, res, next) {
  const apiKey = extractApiKey(req);
  if (!apiKey) return res.status(401).json({ error: 'missing_api_key' });
  const entry = keys[apiKey];
  if (!entry) return res.status(401).json({ error: 'invalid_api_key' });
  // normalize entry
  const partnerId = entry.partnerId || entry.partner || null;
  const scopes = Array.isArray(entry.scopes) ? entry.scopes : [];
  req.mcp = { apiKey, partnerId, scopes };
  next();
}

module.exports = { requireMcpAuth };
