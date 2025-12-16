const { pool } = require('../db');

async function report() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, analysis, model_version, analyzed_at, created_at FROM image_analyses WHERE image_id IS NULL ORDER BY created_at DESC LIMIT 100");
    if (res.rowCount === 0) {
      console.log('No unlinked image_analyses rows found.');
      return;
    }
    console.log(`Found ${res.rowCount} unlinked image_analyses rows (showing up to 100):`);
    for (const row of res.rows) {
      console.log('---');
      console.log('id:', row.id);
      console.log('model_version:', row.model_version);
      console.log('analyzed_at:', row.analyzed_at);
      console.log('created_at:', row.created_at);
      try {
        console.log('analysis:', JSON.stringify(row.analysis, null, 2));
      } catch (e) {
        console.log('analysis: <unserializable>');
      }
    }
    console.log('End of report.');
  } catch (err) {
    console.error('Failed to query image_analyses:', err.message);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
}

report().catch(err => { console.error(err); process.exit(1); });
