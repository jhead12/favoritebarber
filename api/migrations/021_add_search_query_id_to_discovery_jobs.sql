-- migration: add search_query_id FK to discovery_jobs
ALTER TABLE discovery_jobs ADD COLUMN IF NOT EXISTS search_query_id INTEGER;
ALTER TABLE discovery_jobs ADD COLUMN IF NOT EXISTS created_via TEXT;
CREATE INDEX IF NOT EXISTS discovery_jobs_search_query_id_idx ON discovery_jobs(search_query_id);
