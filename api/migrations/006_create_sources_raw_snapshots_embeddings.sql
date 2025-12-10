-- migration: create sources, raw_snapshots, embeddings
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT,
  type TEXT,
  last_sync TIMESTAMPTZ,
  quota_remaining INTEGER,
  meta JSONB
);

CREATE TABLE IF NOT EXISTS raw_snapshots (
  id SERIAL PRIMARY KEY,
  source TEXT,
  source_id TEXT,
  raw_json JSONB,
  raw_html TEXT,
  fetched_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  object_type TEXT,
  object_id INTEGER,
  vector_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geocoding_cache (
  id SERIAL PRIMARY KEY,
  provider TEXT,
  request_hash TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  resolved_address TEXT,
  raw_response_json JSONB,
  fetched_at TIMESTAMPTZ
);
