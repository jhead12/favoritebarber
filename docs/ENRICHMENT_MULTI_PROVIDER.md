# Enrichment Multi-Provider Support

## Overview

The enrichment worker now supports **multiple LLM providers** through the unified `llm_client.js` facade. You can switch providers using the `LLM_PROVIDER` environment variable.

## Supported Providers

### 1. Ollama (Default - Local, Free)
```bash
LLM_PROVIDER=ollama npm run enrich
```
- **Model**: llama3.2:3b (configurable via `OLLAMA_MODEL`)
- **Cost**: $0 (runs locally)
- **Speed**: ~1-2s per review (CPU-dependent)
- **Accuracy**: 48% name extraction, 40% sentiment (from benchmarks)
- **Best For**: Development, privacy-sensitive data, high volume

### 2. OpenAI (API - Paid)
```bash
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... npm run enrich
```
- **Model**: gpt-4o-mini (configurable via `OPENAI_MODEL`)
- **Cost**: ~$0.10-0.20 per 1000 reviews
- **Speed**: ~500-800ms per review
- **Accuracy**: 60% name extraction, 28% sentiment (from benchmarks)
- **Best For**: Production, highest accuracy, when cost is acceptable

### 3. Mock (Deterministic - Testing)
```bash
LLM_PROVIDER=mock npm run enrich
```
- **Model**: Heuristic-based (no LLM)
- **Cost**: $0
- **Speed**: <10ms per review
- **Accuracy**: 24% name extraction, 50% sentiment (baseline)
- **Best For**: CI testing, development without LLM setup

### 4. Hugging Face (Coming Soon)
```bash
LLM_PROVIDER=huggingface HF_API_KEY=... npm run enrich
```
- **Model**: Various open-source models
- **Cost**: Free tier available, then ~$0.06 per 1000 reviews
- **Best For**: Open-source models, cost optimization

## Environment Variables

Set in your `.env` file or export before running:

```bash
# Provider selection
LLM_PROVIDER=ollama              # ollama | openai | mock | huggingface

# Ollama configuration
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# OpenAI configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Fallback chain (comma-separated)
LLM_PROVIDER_FALLBACK=openai,ollama,mock

# Timeout and retries
LLM_TIMEOUT_MS=12000
LLM_MAX_RETRIES=2
```

## Usage Examples

### Enrich with Ollama (Default)
```bash
npm run enrich
```

### Enrich with OpenAI
```bash
# One-time
LLM_PROVIDER=openai npm run enrich

# Or set in .env
echo "LLM_PROVIDER=openai" >> .env
npm run enrich
```

### Test All Providers
```bash
./scripts/test_enrichment_providers.sh
```

### Benchmark Providers on Golden Dataset
```bash
npm run test:llm:benchmark:all
```

### Re-Enrich All Reviews with Different Provider
```bash
# Switch from Ollama to OpenAI
LLM_PROVIDER=openai node workers/enrichment_worker.js --all --force
```

## Provider Metadata

Each enriched review stores:
- `enriched_provider` - Which provider was used (e.g., "openai", "ollama")
- `enriched_model` - Which model version (e.g., "gpt-4o-mini", "llama3.2:3b")
- `enriched_at` - When enrichment occurred

Query reviews by provider:
```sql
-- Count reviews by provider
SELECT enriched_provider, enriched_model, COUNT(*)
FROM reviews
WHERE enriched_at IS NOT NULL
GROUP BY enriched_provider, enriched_model
ORDER BY COUNT(*) DESC;

-- Get OpenAI-enriched reviews
SELECT id, text, extracted_names, enriched_sentiment
FROM reviews
WHERE enriched_provider = 'openai'
LIMIT 10;
```

## Status & Monitoring

### Check Enrichment Status
```bash
npm run enrich:status
```

Output:
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        Review Enrichment Status                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Total Reviews:           1,234
Enriched:                  856 (69.3%)
Pending:                   378 (30.7%)

By Provider:
  ollama (llama3.2:3b)                     650 ( 75.9%)
  openai (gpt-4o-mini)                     200 ( 23.4%)
  heuristic/fallback                         6 (  0.7%)

Average Enrichment Age:  8.3 days
Oldest Unenriched:       25.1 days ago
```

## How It Works

### 1. Review Parser Uses Multi-Provider Facade

**Before** (hardcoded to Ollama):
```javascript
// workers/llm/review_parser.js
const { extractNamesFromReview, analyzeSentiment, summarizeReview } 
  = require('./ollama_client');  ❌ Hardcoded
```

**After** (uses multi-provider):
```javascript
// workers/llm/review_parser.js
const { extractNamesFromReview, analyzeSentiment, summarizeReview } 
  = require('./llm_client');  ✅ Multi-provider
```

### 2. LLM Client Routes to Provider

`workers/llm/llm_client.js` checks `LLM_PROVIDER` and loads:
- `providers/ollama.js` for Ollama
- `providers/openai.js` for OpenAI
- `providers/mock.js` for Mock
- Falls back if provider fails

### 3. Enrichment Worker Stores Provider Info

```javascript
// workers/enrichment_worker.js
async function updateReviewEnrichment(reviewId, enrichmentData) {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  const model = provider === 'ollama' 
    ? (process.env.OLLAMA_MODEL || 'llama3.2:3b')
    : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
  
  await db.query(`
    UPDATE reviews 
    SET 
      enriched_provider = $1,
      enriched_model = $2,
      -- ... other fields
  `, [provider, model, ...]);
}
```

## Migration Strategy

### Switching from Ollama to OpenAI

**Option 1: Enrich New Reviews Only**
```bash
# Set provider for new enrichments
echo "LLM_PROVIDER=openai" >> .env
npm run enrich  # Only processes pending reviews
```

**Option 2: Re-Enrich Everything**
```bash
# Re-process all reviews with OpenAI
LLM_PROVIDER=openai node workers/enrichment_worker.js --all
```

**Option 3: Hybrid Approach**
```bash
# Use OpenAI for high-value reviews, Ollama for bulk
# This requires custom filtering logic (future enhancement)
```

## Cost Comparison

Based on 10,000 reviews:

| Provider | Cost | Time | Accuracy |
|----------|------|------|----------|
| Ollama   | $0   | ~5 hours (local CPU) | 48% names |
| OpenAI   | ~$2  | ~2 hours (API) | 60% names |
| Mock     | $0   | ~5 minutes | 24% names (baseline) |

## Troubleshooting

### Provider Not Available
```bash
npm run enrich
# Error: no_llm_provider_available
```

**Fix**: Ensure provider is configured:
```bash
# For Ollama
ollama serve  # Must be running

# For OpenAI
export OPENAI_API_KEY=sk-proj-...

# Check available providers
node -e "console.log(process.env.LLM_PROVIDER)"
```

### Fallback to Heuristics
If LLM provider fails, enrichment falls back to regex-based heuristics:
- Names: Capitalized words near "barber", "cut", etc.
- Sentiment: Keyword matching (positive/negative words)
- Summary: Truncation to first 100 chars

Check logs:
```bash
npm run enrich 2>&1 | grep -i "fallback\|unavailable"
```

### Provider Metadata Not Showing
Old enrichments won't have provider metadata. Re-run:
```bash
node workers/enrichment_worker.js --all  # Updates all with current provider
```

## Next Steps

1. **Add Hugging Face Provider**: Implement `workers/llm/providers/huggingface.js`
2. **Cost Tracking**: Log API costs per provider to Redis/DB
3. **A/B Testing**: Compare outputs from different providers on same review
4. **Auto-Fallback**: Retry with cheaper provider on timeout/quota
5. **Admin UI**: Web dashboard to switch providers and view stats

## Related Documentation

- [PHASE_B_IMPLEMENTATION.md](PHASE_B_IMPLEMENTATION.md) - LLM test harness & benchmarking
- [PHASE_6_PLAN.md](PHASE_6_PLAN.md) - Full enrichment expansion plan
- [LLM_TESTING_QUICKSTART.md](LLM_TESTING_QUICKSTART.md) - Testing guide
