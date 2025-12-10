-- migration: create locations table (skeleton)
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id),
  source TEXT,
  source_id TEXT,
  street TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT,
  formatted_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geohash TEXT,
  is_mobile BOOLEAN DEFAULT FALSE,
  service_radius_m INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
