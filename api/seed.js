const { pool } = require('./db');

async function seed() {
  // No sample barbers inserted by default. Use focused seed scripts if needed.
  console.log('Seed script run — no sample barbers created');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
