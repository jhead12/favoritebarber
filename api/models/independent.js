const { pool } = require('../db');

/**
 * Create an independent service for a barber
 * data: { description, price_cents, currency, availability (JSON) }
 */
async function createIndependentService(barberId, data) {
  const { description = null, price_cents = null, currency = 'USD', availability = null } = data;
  const res = await pool.query(
    `INSERT INTO independent_services (barber_id, description, price_cents, currency, availability, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,now(),now()) RETURNING *`,
    [barberId, description, price_cents, currency, availability]
  );
  return res.rows[0];
}

async function updateIndependentService(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['description', 'price_cents', 'currency', 'availability', 'is_active']) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }
  if (fields.length === 0) return null;
  values.push(id);
  const q = `UPDATE independent_services SET ${fields.join(',')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
  const res = await pool.query(q, values);
  return res.rows[0];
}

async function getIndependentServicesForBarber(barberId) {
  const res = await pool.query('SELECT * FROM independent_services WHERE barber_id = $1 ORDER BY is_active DESC, created_at DESC', [barberId]);
  return res.rows;
}

/**
 * Find independent barbers near a lat/lng within a radius (meters).
 * Uses haversine formula in SQL against barbers.base_location_id -> locations.latitude/longitude
 * Returns barber rows with computed distance_m.
 */
async function findIndependentBarbersNearby(lat, lng, radiusM = 48280, limit = 50) {
  // Haversine calculation (earth radius in meters)
  const haversine = `6371000 * acos(
      cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2))
      + sin(radians($1)) * sin(radians(l.latitude))
    )`;

  const q = `SELECT b.id AS barber_id, b.name, b.is_independent, b.service_radius_m, l.id AS location_id, l.latitude, l.longitude,
    ${haversine} AS distance_m
    FROM barbers b
    JOIN locations l ON b.base_location_id = l.id
    WHERE b.is_independent = TRUE
      AND (${haversine}) <= $3
    ORDER BY distance_m ASC
    LIMIT $4`;

  const params = [lat, lng, radiusM, limit];
  const res = await pool.query(q, params.concat(params));
  // Note: we passed params twice because the expression uses $1/$2 twice; some drivers allow reuse but Postgres expects explicit values
  return res.rows;
}

module.exports = {
  createIndependentService,
  updateIndependentService,
  getIndependentServicesForBarber,
  findIndependentBarbersNearby,
};

/** Sample SQL (for reference)
 *
 * -- Find independent barbers within 10km of a point
 * SELECT b.id, b.name, l.latitude, l.longitude,
 *   6371000 * acos(cos(radians(37.77)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians(-122.42)) + sin(radians(37.77)) * sin(radians(l.latitude))) AS distance_m
 * FROM barbers b JOIN locations l ON b.base_location_id = l.id
 * WHERE b.is_independent = TRUE
 * HAVING distance_m <= 10000
 * ORDER BY distance_m ASC;
 */
