const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const { generateAPIKey } = require('../../api/middleware/mcpAuth');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
let pool;
let partnerId;
let keyId;
let apiKey;

before(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost/favorite_barber_test' });
  const email = `test+ratelimit+${Date.now()}@example.com`;
  const res = await pool.query(
    `INSERT INTO mcp_partners (name, email, tier, scopes, rate_limit_per_minute, quota_per_day) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ['RL Test Partner', email, 'partner', JSON.stringify(['read:barbers']), 3, 1000]
  );
  partnerId = res.rows[0].id;
  const kr = await generateAPIKey(partnerId, 'test', 'RL Quick Key');
  apiKey = kr.key;
  keyId = kr.id;
});

after(async () => {
  try {
    if (keyId) await pool.query('DELETE FROM mcp_api_keys WHERE id = $1', [keyId]);
    if (partnerId) await pool.query('DELETE FROM mcp_partners WHERE id = $1', [partnerId]);
  } catch (e) { /* ignore */ }
  await pool.end();
});

describe('MCP Rate Limit Quick', () => {
  it('allows up to 3 requests then returns 429', async () => {
    const statuses = [];
    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${API_BASE}/api/mcp/health`, { headers: { Authorization: `Bearer ${apiKey}` } });
      statuses.push(r.status);
    }
    const rl = await fetch(`${API_BASE}/api/mcp/health`, { headers: { Authorization: `Bearer ${apiKey}` } });
    // Expect last to be 429
    assert.strictEqual(rl.status, 429, `Expected 429 but got ${rl.status}`);
    assert.ok(rl.headers.get('Retry-After'), 'Retry-After header present');
    const body = await rl.json().catch(() => null);
    assert.ok(body && (typeof body.error === 'string' ? body.error.includes('Rate') : (body.error && body.error.message && String(body.error.message).includes('Rate'))), 'Error mentions Rate');
  });

  it('returns rate limit headers', async () => {
    // Clear minute/day keys in Redis if available
    try {
      const Redis = require('ioredis');
      const r = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 });
      const now = new Date();
      const minuteKey = `mcp:ratelimit:minute:${partnerId}:${now.getMinutes()}`;
      const dateKey = `mcp:ratelimit:day:${partnerId}:${now.toISOString().slice(0,10)}`;
      await r.del(minuteKey, dateKey);
      await r.quit();
    } catch (e) { /* best-effort */ }

    const res = await fetch(`${API_BASE}/api/mcp/health`, { headers: { Authorization: `Bearer ${apiKey}` } });
    assert.ok(res.headers.get('X-RateLimit-Limit'), 'X-RateLimit-Limit');
    assert.ok(res.headers.get('X-RateLimit-Remaining'), 'X-RateLimit-Remaining');
    assert.ok(res.headers.get('X-RateLimit-Reset'), 'X-RateLimit-Reset');
    const limit = parseInt(res.headers.get('X-RateLimit-Limit'), 10);
    assert.strictEqual(limit, 3, `Expected limit 3 but got ${limit}`);
  });
});
