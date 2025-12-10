

Quick summary — how sentiment is scored and what the values mean.

**How we rate sentiment**
- Scale: numeric values are -1, 0, or +1.
  - `-1` = Negative
  - `0`  = Neutral / Mixed
  - `+1` = Positive
- Primary method: an LLM (Ollama) is asked to return exactly `-1`, `0`, or `1` using an explicit prompt that:
  - Treats clearly positive language as `1` (e.g., amazing, excellent, love).
  - Treats clearly negative language as `-1` (e.g., awful, terrible, never again).
  - Treats mixed/uncertain language as `0` (e.g., decent/okay/average, or explicit positive+negative tradeoffs).
  - Gives rules for dominance when both positive and negative appear (prompt explains examples like "decent haircut but bad service" → neutral).
- Fallback heuristics: if Ollama is unavailable or fails, we use regex/keyword rules:
  - Count positive and negative keyword occurrences and return `1` or `-1` if one side clearly dominates.
  - Return `0` for mixed/indecisive cases or if no strong keywords appear.

Where that logic lives
- LLM + fallback code: ollama_client.js → `analyzeSentiment(reviewText)`.
- Enrichment worker uses that output when processing reviews: enrichment_worker.js (the parsed sentiment is logged and used in enrichment).

How the project uses sentiment values
- Per-review: sentiment is returned as -1/0/1 by the enrichment step (logged as `parsed.sentiment`).
- Aggregation: when computing barber-level metrics, the code maps the -1/0/1 values to a 1–5 scale for averaging (example in docs):
  - `1 (positive)` → 5
  - `0 (neutral)`  → 3
  - `-1 (negative)`→ 1
  This mapping lets sentiment contribute to numerical trust/score calculations alongside ratings.
  (See example SQL in LOCAL_AI_GUIDE.md.)

How to inspect sentiment in the DB
- Example queries you can run to check review-level and barber-level sentiment:

Check raw review enrichment (showing text + any stored sentiment):
```sql
SELECT id, text, sentiment_score, enriched_sentiment, adjectives, prefilter_flags
FROM reviews
WHERE text IS NOT NULL
ORDER BY created_at DESC
LIMIT 25;
```

Compute barber-level average using mapped values (example from docs):
```sql
SELECT b.id, b.name,
  AVG(CASE WHEN r.enriched_sentiment = 1 THEN 5 WHEN r.enriched_sentiment = 0 THEN 3 ELSE 1 END) AS sentiment_score,
  COUNT(*) AS review_count
FROM barbers b
LEFT JOIN reviews r ON r.barber_id = b.id
GROUP BY b.id, b.name
ORDER BY sentiment_score DESC
LIMIT 50;
```

Notes, caveats, and next improvements
- Mixed/multi-aspect reviews are the hardest cases (tone trade-offs, sarcasm); prompt + examples help but won't be perfect.
- Confidence: the code and docs include confidence bookkeeping (if the LLM returns confidence we could persist it); currently the LLM prompt returns a discrete label and fallback is deterministic.
- Persistence: if you want the `enriched_sentiment` column written by the enrichment worker (so `enriched_sentiment` is stored per review and used in aggregations), I can:
  - Patch enrichment_worker.js to persist `parsed.sentiment` into `reviews.enriched_sentiment` (and optionally `sentiment_confidence`).
  - Add a small verification query and script that shows before/after counts.
- Improvements to consider:
  - Return a confidence score (LLM probability or heuristic score) and persist it.
  - Use a small numeric sentiment range (e.g., -1.0 .. +1.0) when you want more nuance than 3 buckets.
  - Add unit tests for edge cases (mixed sentiment, sarcasm, contradictory adjectives).

Would you like me to:
- Persist `parsed.sentiment` into `reviews.enriched_sentiment` now (I'll patch the worker and run a quick `--sample` test), or
- Add a confidence field and persist `sentiment_confidence`, or
- Produce a quick report of counts (how many reviews are positive/neutral/negative) from your DB?

Pick one and I’ll implement/run it.