const { pool } = require('../db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Create a location
    const locRes = await client.query(
      `INSERT INTO locations (formatted_address, latitude, longitude) VALUES ($1,$2,$3) RETURNING id`,
      ['12625 Frederick St, Moreno Valley, CA', 33.915, -117.242]
    );
    const locationId = locRes.rows[0].id;

    // Create shop
    const shopRes = await client.query(
      `INSERT INTO shops (name, yelp_business_id, primary_location_id, trust_score) VALUES ($1,$2,$3,$4) RETURNING id`,
      ['The Men\'s Club Barbershop', '8gKJNAY3SdewmARKWIvjBg', locationId, 74]
    );
    const shopId = shopRes.rows[0].id;

    // Create barber
    const barberRes = await client.query(
      `INSERT INTO barbers (name, trust_score, primary_location_id) VALUES ($1,$2,$3) RETURNING id`,
      ['John Sample', 78, locationId]
    );
    const barberId = barberRes.rows[0].id;

    // Associate barber with shop
    await client.query(
      `INSERT INTO shop_barbers (shop_id, barber_id, is_current) VALUES ($1,$2,$3)`,
      [shopId, barberId, true]
    );

    await client.query('COMMIT');
    console.log('Seeded sample shop:', shopId, 'barber:', barberId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
