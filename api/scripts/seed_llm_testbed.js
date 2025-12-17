const fs = require('fs');
const path = require('path');

const FIXTURE = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'llm_golden.json');
async function main() {
  const outPath = path.resolve(__dirname, 'seed_llm_testbed_output.json');
  try {
    const raw = fs.readFileSync(FIXTURE, 'utf8');
    const cases = JSON.parse(raw);
    // Attempt to insert into DB if pool is available
    let didInsert = false;
    try {
      const db = require('../db');
      if (db && db.pool) {
        const client = await db.pool.connect();
        try {
          for (const c of cases) {
            // simple insert into `reviews` table if present; tolerate missing columns
            await client.query(`INSERT INTO reviews (external_id, content, created_at) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`, [c.id, c.text]);
          }
          didInsert = true;
        } finally { client.release(); }
      }
    } catch (e) {
      // ignore DB errors and fall back to local output
      console.warn('DB insert skipped:', e && e.message ? e.message : e);
    }

    if (!didInsert) {
      fs.writeFileSync(outPath, JSON.stringify(cases, null, 2));
      console.log('Wrote seed output to', outPath);
      console.log('To load into the DB manually, run `node api/scripts/seed_llm_testbed.js` with DATABASE_URL set and ensure `reviews` table exists.');
    } else {
      console.log('Inserted seed cases into DB (reviews table)');
    }
  } catch (e) {
    console.error('Failed to seed llm testbed:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

if (require.main === module) main();
