-- migration: create review_name_candidates table
CREATE TABLE IF NOT EXISTS review_name_candidates (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  normalized_name TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.00,
  matched_barber_id INTEGER REFERENCES barbers(id),
  matched_score NUMERIC(5,2),
  source TEXT DEFAULT 'heuristic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_name_candidates_review_id ON review_name_candidates(review_id);
CREATE INDEX IF NOT EXISTS idx_review_name_candidates_matched_barber_id ON review_name_candidates(matched_barber_id);
