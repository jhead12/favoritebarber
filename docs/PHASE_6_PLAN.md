# Phase 6 - LLM Provider Expansion: Ollama-Based Enrichment

**Goal**: Enrich existing reviews with Ollama-based LLM analysis (sentiment, names, summaries) and enable batch processing infrastructure.

## Current State Analysis

### ✅ Already Implemented
1. **Database Schema** ([api/migrations/011_add_llm_enrichment_columns.sql](../api/migrations/011_add_llm_enrichment_columns.sql))
   - `extracted_names` (TEXT) - Comma-separated barber names
   - `review_summary` (TEXT) - LLM-generated summary
   - `enriched_at` (TIMESTAMPTZ) - Enrichment timestamp
   - `enriched_sentiment` (NUMERIC) - LLM sentiment score (-1 to 1)
   - `sentiment_score` (NUMERIC) - Adjusted score with adjective bonus
   - `adjectives` (JSONB) - Extracted adjectives
   - `language` (VARCHAR) - Detected language
   - `prefilter_flags` (JSONB) - Spam/moderation flags

2. **Provider Metadata** ([api/migrations/026_add_enriched_provider_metadata.sql](../api/migrations/026_add_enriched_provider_metadata.sql))
   - `enriched_provider` (TEXT) - Provider name (ollama, openai, etc.)
   - `enriched_model` (TEXT) - Model identifier
   - Index on `enriched_provider` for filtering

3. **Enrichment Worker** ([workers/enrichment_worker.js](../workers/enrichment_worker.js))
   - Processes reviews with `enriched_at IS NULL`
   - Calls `parseReview()` from review_parser.js
   - Updates reviews with enrichment data
   - Aggregates barber languages and adjectives
   - Supports `--pending`, `--all`, `--sample` modes

4. **LLM Infrastructure**
   - Multi-provider facade: `workers/llm/llm_client.js`
   - Ollama adapter: `workers/llm/providers/ollama.js`
   - OpenAI adapter: `workers/llm/providers/openai.js`
   - Review parser: `workers/llm/review_parser.js`
   - Environment: `LLM_PROVIDER=ollama` (default)

5. **API Endpoints**
   - MCP enrichment endpoint: `GET /api/mcp/enrich/reviews?barber_id=123`
   - Real-time enrichment for MCP partners

### ⚠️ Gaps to Address

1. **Provider Metadata Not Persisted**
   - `enriched_provider` and `enriched_model` columns exist but not populated
   - Migration exists but worker doesn't set these fields

2. **No Batch Enrichment Command**
   - Worker runs via `node workers/enrichment_worker.js`
   - No npm script for easy invocation
   - No progress reporting or ETA

3. **No Re-Enrichment Strategy**
   - Can't easily switch providers and re-process
   - No `--force` flag to override existing enrichments
   - No provider comparison mode

4. **Limited Error Handling**
   - No retry logic for transient LLM failures
   - No dead-letter queue for failed enrichments
   - No telemetry/monitoring

5. **No Performance Metrics**
   - No tracking of enrichment speed (reviews/min)
   - No cost tracking per provider
   - No quality metrics (how many names extracted, etc.)

## Implementation Plan

### Task 1: Update Enrichment Worker to Store Provider Metadata ✅ Priority 1

**File**: `workers/enrichment_worker.js`

**Changes**:
```javascript
// In updateReviewEnrichment(), add provider fields:
UPDATE reviews SET
  extracted_names = $1,
  review_summary = $2,
  enriched_at = NOW(),
  enriched_provider = $3,     // NEW
  enriched_model = $4,         // NEW
  prefilter_flags = $5,
  prefilter_details = $6,
  adjectives = $7,
  enriched_sentiment = $8,
  sentiment_score = $9
WHERE id = $10;
```

**Why**: Track which provider enriched each review for A/B testing and re-enrichment.

---

### Task 2: Add NPM Scripts for Easy Enrichment ✅ Priority 1

**File**: `package.json` (root)

**Add**:
```json
"scripts": {
  "enrich": "node workers/enrichment_worker.js --pending",
  "enrich:all": "node workers/enrichment_worker.js --all",
  "enrich:sample": "node workers/enrichment_worker.js --sample",
  "enrich:status": "node workers/scripts/enrichment_status.js"
}
```

**Why**: Standardize enrichment commands for developers and CI.

---

### Task 3: Create Enrichment Status/Stats Script ✅ Priority 2

**New File**: `workers/scripts/enrichment_status.js`

**Purpose**: Show enrichment progress across providers
```
╔══════════════════════════════════════════════════════════════════════╗
║                    Review Enrichment Status                          ║
╠══════════════════════════════════════════════════════════════════════╣
║ Total Reviews:           12,456                                      ║
║ Enriched:                 8,234 (66.1%)                              ║
║ Pending:                  4,222 (33.9%)                              ║
║                                                                      ║
║ By Provider:                                                         ║
║   ollama (llama3.2:3b):   6,800 (82.6%)                             ║
║   openai (gpt-4o-mini):   1,234 (15.0%)                             ║
║   fallback (heuristic):     200 ( 2.4%)                             ║
║                                                                      ║
║ Average Enrichment Age:   12 days                                   ║
║ Oldest Unenriched:        42 days ago                               ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### Task 4: Add Provider Selection & Force Re-Enrichment ✅ Priority 2

**File**: `workers/enrichment_worker.js`

**Changes**:
```javascript
// Parse CLI args:
// --provider=openai  : Use specific provider
// --force            : Re-enrich even if enriched_at is set
// --since=2024-12-01 : Only enrich reviews after date

async function fetchReviewsToEnrich(options) {
  const { allReviews, forceReenrich, provider, since, limit } = options;
  
  let whereClauses = ["r.text IS NOT NULL", "r.text != ''"];
  
  if (!forceReenrich && !allReviews) {
    whereClauses.push("r.enriched_at IS NULL");
  }
  
  if (provider && !forceReenrich) {
    // Skip already enriched by this provider
    whereClauses.push("(r.enriched_provider IS NULL OR r.enriched_provider != $2)");
  }
  
  if (since) {
    whereClauses.push("r.created_at >= $3");
  }
  
  // ...build query
}
```

---

### Task 5: Add Batch Progress & ETA Reporting ✅ Priority 2

**File**: `workers/enrichment_worker.js`

**Enhancement**:
```javascript
let processed = 0;
const startTime = Date.now();

for (const review of reviews) {
  processed++;
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = processed / elapsed;
  const remaining = reviews.length - processed;
  const eta = remaining / rate;
  
  console.log(`[${processed}/${reviews.length}] Enriching review ${review.id}... (${rate.toFixed(1)}/s, ETA: ${formatETA(eta)})`);
  // ... enrichment logic
}
```

---

### Task 6: Add Telemetry & Error Tracking ✅ Priority 3

**New Table**: `api/migrations/029_add_llm_enrichment_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS llm_enrichment_logs (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id),
  provider TEXT NOT NULL,
  model TEXT,
  operation TEXT NOT NULL,  -- 'extract_names', 'sentiment', 'summarize'
  success BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error_message TEXT,
  prompt_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_logs_review ON llm_enrichment_logs(review_id);
CREATE INDEX idx_llm_logs_provider_success ON llm_enrichment_logs(provider, success);
CREATE INDEX idx_llm_logs_created ON llm_enrichment_logs(created_at DESC);
```

**Purpose**: Debug failures, track provider performance, audit enrichment history.

---

### Task 7: Add Cost Tracking ✅ Priority 3

**Enhancement**: Extend existing `api/lib/costTracker.js`

```javascript
// Track LLM costs per provider
function trackLLMCost(provider, model, operation, tokens) {
  const costs = {
    'openai:gpt-4o-mini': { input: 0.15, output: 0.60 },  // per 1M tokens
    'ollama:llama3.2:3b': { input: 0, output: 0 }         // local = free
  };
  
  const key = `${provider}:${model}`;
  const rate = costs[key] || { input: 0, output: 0 };
  const cost = (tokens.input * rate.input + tokens.output * rate.output) / 1_000_000;
  
  // Log to Redis or DB
  redis.incrby('llm:cost:total', Math.round(cost * 10000));
  redis.hincrby('llm:cost:by_provider', provider, Math.round(cost * 10000));
}
```

---

### Task 8: Add Re-Enrichment Dashboard (Optional) ⭐ Priority 4

**New File**: `web/pages/admin/enrichment.tsx`

**Features**:
- Show enrichment stats by provider
- Trigger batch re-enrichment via API
- Compare provider outputs side-by-side
- Download enrichment logs CSV

---

## Quick Start Commands

### Run Enrichment (Pending Reviews Only)
```bash
npm run enrich
# or
node workers/enrichment_worker.js --pending
```

### Re-Enrich All Reviews with OpenAI
```bash
LLM_PROVIDER=openai node workers/enrichment_worker.js --all --force
```

### Check Enrichment Status
```bash
npm run enrich:status
```

### Test with Sample Data (No DB)
```bash
npm run enrich:sample
```

## Success Metrics

**Phase 6 Complete When**:
- ✅ Provider metadata persisted on all enrichments
- ✅ NPM scripts for easy enrichment (`npm run enrich`)
- ✅ Status dashboard showing enrichment progress
- ✅ Force re-enrichment with `--force` flag
- ✅ Telemetry logging enrichment operations
- ✅ Cost tracking for OpenAI vs Ollama

**Stretch Goals**:
- Parallel enrichment with worker pool
- Dead-letter queue for failed enrichments
- Automatic retry with exponential backoff
- Admin UI for re-enrichment

## Timeline

**Week 1**: Tasks 1-3 (Provider metadata, npm scripts, status reporting)  
**Week 2**: Tasks 4-5 (Force re-enrichment, progress tracking)  
**Week 3**: Tasks 6-7 (Telemetry, cost tracking)  
**Week 4**: Task 8 (Optional dashboard)

## Next Phase

After Phase 6, proceed to:
- **Phase 7**: Add Hugging Face provider adapter
- **Phase 8**: Trust & Verification (spam detection with LLM)
- **Phase F.1**: Barber claim & curate workflow
