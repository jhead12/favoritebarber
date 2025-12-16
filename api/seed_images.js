const { pool } = require('./db');

async function seedImages() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const urls = [
      { url: 'https://s3.example.com/uploads/barber-shop-1.jpg', source: 'yelp', source_id: 'sample-img-1' },
      { url: 'https://example.com/photos/landscape.jpg', source: 'scraped', source_id: 'sample-img-2' }
    ];

    for (const u of urls) {
      const res = await client.query(
        `INSERT INTO images (barber_id, source, source_id, url, fetched_at) VALUES ($1,$2,$3,$4,now()) RETURNING id, url`,
        [null, u.source, u.source_id, u.url]
      );
      console.log('Inserted image', res.rows[0].id, res.rows[0].url);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedImages().catch(err => { console.error(err); process.exit(1); });
