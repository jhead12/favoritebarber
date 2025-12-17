-- migration: create discovery_jobs table for background social discovery
CREATE TABLE IF NOT EXISTS discovery_jobs (
  id SERIAL PRIMARY KEY,
  shop_name TEXT,
  location_text TEXT,
  yelp_business_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discovery_jobs_status_idx ON discovery_jobs(status);
