const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rateyourbarber';
const pool = new Pool({ connectionString });

async function query(text, params) {
	return pool.query(text, params);
}

module.exports = { pool, query };
