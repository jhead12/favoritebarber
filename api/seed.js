const { pool } = require('./db');

async function seed() {
  await pool.query("INSERT INTO barbers (name, trust_score) VALUES ($1,$2) RETURNING id", ['Sample Barber', 75]);
  console.log('Seed complete');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
