-- migration: support independent/mobile barbers

-- Add flags and base location to barbers
ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS is_independent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_location_id INTEGER;

-- Service radius (meters) for mobile barbers
ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS service_radius_m INTEGER DEFAULT 0;

-- Table to describe independent barber service offerings (one-to-many)
CREATE TABLE IF NOT EXISTS independent_services (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  description TEXT,
  price_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  availability JSONB, -- structured weekly schedule or freeform
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Optionally add FK constraint for base_location_id pointing to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_barbers_base_location'
      AND table_name = 'barbers'
  ) THEN
    ALTER TABLE barbers
      ADD CONSTRAINT fk_barbers_base_location FOREIGN KEY (base_location_id) REFERENCES locations(id);
  END IF;
END $$;
