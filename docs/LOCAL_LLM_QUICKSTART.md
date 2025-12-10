# Local LLM Quick Start

**TL;DR: Set up and test local Llama 3.2 (3B) for review enrichment in 5 minutes.**

## 1. Install Ollama

```bash
# macOS
brew install ollama

# Verify
ollama --version
```

## 2. Pull Llama Model (First Time Only)

```bash
ollama pull llama3.2:3b
# ~2GB download, ~2 min on fast internet
```

## 3. Run Ollama Server

Open a new terminal and keep this running during development:

```bash
ollama serve
# Runs on http://localhost:11434
```

## 4. Update `.env`

```bash
# Copy .env.example to .env if not done yet
cp .env.example .env

# Verify these are set:
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## 5. Test It Works

```bash
cd /Volumes/PRO-BLADE/Github/RateYourBarber
node workers/llm/test_ollama.js

# Expected: ✓ Ollama is reachable, sentiment scores, extracted names
```

## 6. Process Reviews

Once database has reviews (from Yelp fetcher), run:

```bash
# Enrich all pending reviews (no DB enrichment yet)
node workers/enrichment_worker.js --pending

# Or test with sample data offline
node workers/enrichment_worker.js --sample
```

## File Map

| File | Purpose |
|------|---------|
| `workers/llm/ollama_client.js` | Core Ollama interface (name extraction, sentiment, summarization) |
| `workers/llm/test_ollama.js` | Quick test: verify Ollama + fallbacks work |
| `workers/llm/review_parser.js` | Public wrapper: `parseReview(text)`, `parseReviews(array)` |
| `workers/enrichment_worker.js` | Background job: fetch reviews from DB, enrich, update DB |
| `api/migrations/011_add_llm_enrichment_columns.sql` | DB schema: `extracted_names`, `review_summary`, `enriched_at` |
| `docs/LOCAL_LLM_INTEGRATION.md` | Full reference (models, troubleshooting, performance tips) |

## Common Tasks

### Enrich All New Reviews

```bash
node workers/enrichment_worker.js --pending
```

Processes reviews where `enriched_at IS NULL`. If Ollama is unavailable, uses heuristics gracefully.

### Re-process Everything

```bash
node workers/enrichment_worker.js --all
```

Slower; re-runs enrichment on all reviews. Useful after model upgrades.

### Test Offline (No Database)

```bash
node workers/enrichment_worker.js --sample
```

Tests enrichment pipeline with sample reviews; no database required.

### Check Ollama Status

```bash
curl http://localhost:11434/api/status
# Returns: {"status":"success"}
```

### Change Model

Edit `.env`:
```
OLLAMA_MODEL=llama3.2:1b
```

Then pull it:
```bash
ollama pull llama3.2:1b
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Ollama is not reachable" | Run `ollama serve` in a separate terminal |
| "Model not found (404)" | Run `ollama pull llama3.2:3b` |
| "Timeout on first query" | Normal (~5s); model loading into memory. Later queries ~2s |
| "High CPU usage" | Expected; Llama 3.2 running inference. Consider smaller model if too slow. |

## Performance

- **Ollama + Llama 3.2 (3B) on CPU**: ~2–5s per review
- **Ollama on GPU** (Apple Metal, NVIDIA): ~0.5–1s per review
- **Heuristic fallback** (if Ollama down): <10ms per review

**Recommendation**: Batch enrich reviews in background jobs, not on API request path.

## Architecture

```
Yelp Fetcher
    ↓ (stores reviews in DB)
    ↓
Enrichment Worker (node workers/enrichment_worker.js --pending)
    ├─→ ollama_client.js
    │   └─→ Ollama API (or heuristics)
    ├─→ Extract names, sentiment, summary
    └─→ Update DB (extracted_names, review_summary, enriched_at)
    ↓
API (SELECT * FROM reviews WHERE extracted_names IS NOT NULL)
    ↓
Frontend (display barber names, trust scores)
```

---

**Next**: Wire enrichment into Yelp fetcher to auto-enrich on import, or run `--pending` periodically via cron/job scheduler.
