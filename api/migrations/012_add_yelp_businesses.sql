-- Migration: create yelp_businesses table for cached Yelp data
CREATE TABLE IF NOT EXISTS yelp_businesses (
  id TEXT PRIMARY KEY,
  raw JSONB NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  name TEXT,
  address TEXT,
  rating REAL,
  images JSONB,
  categories JSONB,
  last_fetched_at TIMESTAMPTZ DEFAULT now(),
  graphql_enriched BOOLEAN DEFAULT false,
  last_graphql_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_yelp_businesses_lat_lon ON yelp_businesses (latitude, longitude);
