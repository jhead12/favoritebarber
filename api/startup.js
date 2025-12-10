require('dotenv').config();
const { spawn } = require('child_process');
const { pool } = require('./db');

async function waitForDb(retries = 60, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database reachable');
      return;
    } catch (err) {
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Timed out waiting for database');
}

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('\nRunning migrations...');
    const p = spawn(process.execPath, ['migrate.js'], { cwd: __dirname, stdio: 'inherit' });
    p.on('close', (code) => {
      if (code === 0) return resolve();
      return reject(new Error('migrate.js exited with code ' + code));
    });
  });
}

async function main() {
  try {
    await waitForDb();
    await runMigrations();
    console.log('Starting API...');
    require('./index');
  } catch (err) {
    console.error('Startup failed', err);
    process.exit(1);
  }
}

main();
