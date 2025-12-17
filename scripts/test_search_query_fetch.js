const { pool } = require('../api/db');
const fetch = global.fetch || require('node-fetch');

async function insertTest() {
  const res = await pool.query(
    `INSERT INTO search_queries (query_text, location_text, user_agent, ip_address, results, created_at, updated_at) VALUES ($1,$2,$3,$4,$5, now(), now()) RETURNING *`,
    ['Test Shop XYZ', 'Test City, TS', 'test-agent', '127.0.0.1', JSON.stringify({ placeholder: true })]
  );
  return res.rows[0];
}

async function main() {
  try {
    const row = await insertTest();
    console.log('Inserted search_query id=', row.id);
    // try HTTP fetch if API is running
    try {
      const url = `http://localhost:3000/api/search/queries/${row.id}`;
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        console.log('HTTP GET /api/search/queries/:id returned:', j);
        process.exit(0);
      } else {
        console.log('HTTP GET failed', r.status);
      }
    } catch (e) {
      console.log('API not reachable, printing DB row:');
      console.log(row);
    }
  } catch (e) {
    console.error('Test failed', e.message || e);
    process.exit(1);
  } finally {
    pool.end();
  }
}

main();
