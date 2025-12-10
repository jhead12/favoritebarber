-- migration: create image_analyses table (skeleton)
CREATE TABLE IF NOT EXISTS image_analyses (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id),
  model TEXT,
  tags JSONB,
  hair_tags JSONB,
  caption TEXT,
  embedding_id INTEGER,
  confidence JSONB,
  moderated BOOLEAN DEFAULT FALSE,
  overridden_tags JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
