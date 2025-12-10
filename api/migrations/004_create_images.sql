-- migration: create images table (skeleton)
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id),
  source TEXT,
  source_id TEXT,
  url TEXT,
  width INTEGER,
  height INTEGER,
  checksum TEXT,
  fetched_at TIMESTAMPTZ
);
