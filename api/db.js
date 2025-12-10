const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rateyourbarber';
const pool = new Pool({ connectionString });
module.exports = { pool };
