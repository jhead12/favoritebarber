const { execSync } = require('child_process');
const { pool } = require('../../api/db');

async function run() {
  console.log('Seeding images...');
  let seedOut;
  try {
    seedOut = execSync('node api/seed_images.js', { encoding: 'utf8' });
    console.log(seedOut);
  } catch (err) {
    console.error('Seeding failed:', err.stdout ? err.stdout.toString() : err.message);
    process.exit(1);
  }

  // Parse inserted IDs from seed output
  const idMatches = [...(seedOut.matchAll(/Inserted image (\d+)/g))].map(m => Number(m[1]));
  if (!idMatches.length) {
    console.error('No image IDs parsed from seed output');
    process.exit(1);
  }
  console.log('Seeded image IDs:', idMatches.join(', '));

  console.log('Running image processor for pending images...');
  try {
    execSync('node workers/image_processor.js --pending 10', { stdio: 'inherit' });
  } catch (err) {
    console.error('Image processor failed:', err.message);
    process.exit(1);
  }

  console.log('Verifying DB updates...');
  try {
    // Check that images have relevance_score > 0
    const res = await pool.query('SELECT id, relevance_score, authenticity_score FROM images WHERE id = ANY($1)', [idMatches]);
    if (res.rowCount !== idMatches.length) {
      console.error('Unexpected number of images returned', res.rowCount);
      process.exit(1);
    }
    for (const row of res.rows) {
      if (!row.relevance_score || Number(row.relevance_score) <= 0) {
        console.error('Image', row.id, 'has invalid relevance_score:', row.relevance_score);
        process.exit(1);
      }
    }

    // Check image_analyses rows exist for these images (try integer compare, fallback to text)
    let analysesCount = 0;
    try {
      const a = await pool.query('SELECT COUNT(*)::int as cnt FROM image_analyses WHERE image_id = ANY($1::int[])', [idMatches]);
      analysesCount = Number(a.rows[0].cnt);
    } catch (e) {
      const a = await pool.query('SELECT COUNT(*)::int as cnt FROM image_analyses WHERE image_id = ANY($1)', [idMatches.map(String)]);
      analysesCount = Number(a.rows[0].cnt);
    }

    if (analysesCount < idMatches.length) {
      console.error('Expected at least', idMatches.length, 'image_analyses rows, got', analysesCount);
      process.exit(1);
    }

    console.log('Integration test passed: images processed and analyses created.');
  } catch (err) {
    console.error('DB verification failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
