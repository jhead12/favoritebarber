-- migration: add LLM enrichment columns to reviews
-- Supports local Llama 3.2 (Ollama) review parsing for name extraction and summarization

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS extracted_names TEXT,
ADD COLUMN IF NOT EXISTS review_summary TEXT,
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_enriched_at ON reviews(enriched_at DESC);
