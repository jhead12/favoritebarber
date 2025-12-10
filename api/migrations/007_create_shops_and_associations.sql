-- migration: create shops table and add shop_id to related tables
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  name TEXT,
  yelp_business_id TEXT,
  metadata JSONB,
  trust_score NUMERIC DEFAULT 0,
  primary_location_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- add shop_id to locations, images, reviews (nullable)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS shop_id INTEGER;
ALTER TABLE images ADD COLUMN IF NOT EXISTS shop_id INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS shop_id INTEGER;

-- optional association table to list current barbers for a shop
CREATE TABLE IF NOT EXISTS shop_barbers (
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  role TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (shop_id, barber_id)
);
