-- migration: create search_queries table to record user search events and results
CREATE TABLE IF NOT EXISTS search_queries (
  id SERIAL PRIMARY KEY,
  query_text TEXT,
  location_text TEXT,
  user_agent TEXT,
  ip_address TEXT,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_queries_query_text_idx ON search_queries USING gin (to_tsvector('english', coalesce(query_text, '')));
