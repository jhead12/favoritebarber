-- migration: create barber_social_links table to link barbers to social profiles
CREATE TABLE IF NOT EXISTS barber_social_links (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  social_profile_id INTEGER NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  role TEXT, -- e.g. 'owner','stylist','assistant'
  confidence NUMERIC DEFAULT 0,
  evidence JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_social_unique ON barber_social_links(barber_id, social_profile_id);
