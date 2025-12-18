const { Pool } = require('pg');
// Prefer DATABASE_URL when provided (tests set this), otherwise default to
// the local test database used by unit tests for parity.
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/favorite_barber_test';
const pool = new Pool({ connectionString });

async function query(text, params) {
	return pool.query(text, params);
}

module.exports = { pool, query };
