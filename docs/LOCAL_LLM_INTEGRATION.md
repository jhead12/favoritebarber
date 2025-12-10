# Local LLM Integration Guide

## Overview

This document describes how Rate Your Barber uses local Llama 3.2 (3B) via Ollama for privacy-preserving text analysis. All review data remains on your machine—no external API calls for NLP.

## Architecture

```
Yelp Fetcher (workers/crawlers/yelp_fetcher.ts)
    ↓
    └─→ Review Enrichment Pipeline
            ├─→ ollama_client.js (Ollama interface)
            │   ├─→ Check Ollama health
            │   ├─→ Call Llama 3.2 (if available)
            │   └─→ Fallback to local heuristics
            │
            └─→ Extract:
                ├─ Barber names (NER)
                ├─ Sentiment score (0.0–1.0)
                ├─ Summary (first 3 sentences)
                └─ Store in PostgreSQL
```

## Module Descriptions

### `workers/llm/ollama_client.js`

Core module providing Ollama integration with heuristic fallbacks.

**Exported Functions:**

1. **`checkOllama()`** — Verify Ollama service is reachable.
   - Returns: `{ available: boolean, message: string }`
   - Example: `{ available: true, message: "Ollama is reachable at http://localhost:11434" }`

2. **`callOllama(prompt, systemRole = "")`** — Send prompt to Llama 3.2.
   - Params:
     - `prompt` (string): User query
     - `systemRole` (string, optional): System instructions for model context
   - Returns: `{ success: boolean, response: string }`
   - Falls back to empty string if Ollama unavailable

3. **`extractNamesFromReview(reviewText)`** — Named Entity Recognition for barber/stylist names.
   - Uses Ollama if available; falls back to regex pattern matching (heuristic: "cut by [Name]", "by [Name]", etc.)
   - Returns: `{ names: [string], confidence: number }`
   - Example:
     ```json
     {
       "names": ["Tony", "Maria"],
       "confidence": 0.8
     }
     ```

4. **`analyzeSentiment(reviewText)`** — Sentiment classification (0.0 = negative, 1.0 = positive).
   - Uses Ollama if available; falls back to keyword scoring (positive words: "great", "amazing", "love"; negative: "bad", "terrible", "awful")
   - Returns: `{ sentiment: number, confidence: number }`
   - Example: `{ sentiment: 0.85, confidence: 0.9 }`

5. **`summarizeReview(reviewText)`** — Extract first 3 sentences or ~200 characters max.
   - Uses Ollama if available; falls back to regex sentence splitting
   - Returns: `{ summary: string }`
   - Example: `{ summary: "Amazing haircut! The barber was very skilled. Highly recommend." }`

### `workers/llm/review_parser.js`

Public wrapper module for batch processing reviews.

**Exported Functions:**

1. **`parseReview(reviewText)`** — Parse a single review.
   - Returns promise resolving to:
     ```json
     {
       "names": ["Tony"],
       "sentiment": 0.9,
       "summary": "Great service and skilled barber."
     }
     ```

2. **`parseReviews(reviewsArray)`** — Parse multiple reviews in parallel.
   - Params: `[{ text: "..." }, { text: "..." }, ...]`
   - Returns promise resolving to array of parsed reviews

## Setup Instructions

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download/windows

### 2. Pull Llama 3.2 (3B) Model

```bash
ollama pull llama3.2:3b
```

Monitor output; the model is ~2GB. Subsequent uses will be cached locally.

### 3. Start Ollama Server

In a separate terminal (keep running during development):

```bash
ollama serve
```

The API will listen on `http://localhost:11434` by default.

### 4. Configure Environment Variables

Update `.env`:

```bash
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### 5. Test the Setup

```bash
cd /path/to/RateYourBarber
node workers/llm/test_ollama.js
```

**Expected output:**
```
Testing Ollama/Llama client...
✓ Ollama is reachable at http://localhost:11434

Testing name extraction:
Sample 1: Tony was amazing! He gave me a perfect fade.
Names: ['Tony']

Testing sentiment analysis:
Sample 1 Sentiment: 0.95

Testing review summarization:
Sample 1 Summary: Tony was amazing!
```

If Ollama is unavailable, you'll see:
```
⚠ Ollama is not reachable. Falling back to heuristics.
```

All functions will use local regex/keyword heuristics instead. No errors—graceful degradation.

## Integration with Enrichment Pipeline

To wire review parsing into the Yelp fetcher or enrichment worker:

### Example 1: Enrich a Single Review

```javascript
// In workers/crawlers/yelp_fetcher.ts or workers/enrichment_worker.js

const { parseReview } = require('../llm/review_parser.js');

async function enrichYelpReview(reviewText) {
  const parsed = await parseReview(reviewText);
  
  return {
    text: reviewText,
    sentiment: parsed.sentiment,
    extracted_names: parsed.names.join(', '),
    summary: parsed.summary
  };
}

// Usage:
const enriched = await enrichYelpReview("Tony gave me the best fade I've ever had!");
// enriched = {
//   text: "Tony gave me the best fade I've ever had!",
//   sentiment: 0.95,
//   extracted_names: "Tony",
//   summary: "Tony gave me the best fade I've ever had!"
// }
```

### Example 2: Batch Enrich Multiple Reviews

```javascript
const { parseReviews } = require('../llm/review_parser.js');

async function enrichYelpReviews(reviewsArray) {
  const parsed = await parseReviews(reviewsArray);
  
  return reviewsArray.map((review, idx) => ({
    ...review,
    sentiment: parsed[idx].sentiment,
    extracted_names: parsed[idx].names,
    summary: parsed[idx].summary
  }));
}

// Usage:
const enriched = await enrichYelpReviews([
  { text: "Tony was great!" },
  { text: "Worst haircut ever." }
]);
```

### Example 3: Persist to Database

```javascript
// In api/models/review.js or similar

const db = require('../db.js');
const { parseReview } = require('../../workers/llm/review_parser.js');

async function persistReviewWithEnrichment(shopId, reviewData) {
  const parsed = await parseReview(reviewData.text);
  
  const query = `
    INSERT INTO reviews (shop_id, author_name, text, rating, sentiment, extracted_names, summary, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING id;
  `;
  
  const result = await db.query(query, [
    shopId,
    reviewData.author,
    reviewData.text,
    reviewData.rating,
    parsed.sentiment,
    parsed.names.join(', '),
    parsed.summary
  ]);
  
  return result.rows[0];
}
```

## Performance Considerations

### Latency

- **Ollama + Llama 3.2 (3B) on CPU**: ~2–5 seconds per review (typical laptop)
- **Ollama on GPU** (NVIDIA, Apple Metal): ~0.5–1 second per review
- **Heuristic fallback**: <10ms per review

### Memory

- Llama 3.2 (3B) loaded in Ollama: ~6–8 GB RAM on CPU (quantized)
- Ollama service overhead: ~100 MB

### Recommendations

- **Batch processing**: Use `parseReviews()` to process multiple reviews in parallel
- **Async workers**: Don't block API endpoints; run enrichment in background jobs (Redis queue)
- **Rate limiting**: If using external Yelp API, batch review fetches to avoid rate limits

## Troubleshooting

### "Ollama is not reachable"

1. Verify Ollama is running: `ollama serve` in terminal
2. Check endpoint: `curl http://localhost:11434/api/status`
3. Verify `.env` has `OLLAMA_ENDPOINT=http://localhost:11434`

### "Model 'llama3.2:3b' not found"

1. Pull the model: `ollama pull llama3.2:3b`
2. Verify downloaded: `ollama list` (should show llama3.2:3b)

### "Call to Ollama failed: timeout"

1. First query is slow (~5s) to load model into memory
2. Subsequent queries are faster (~2s)
3. If timeout continues, increase `OLLAMA_TIMEOUT` in `.env`

### "Very high CPU/memory usage"

1. Ollama is loading model into memory (first run)
2. If persistent, your machine may not have enough resources for 3B model
3. Alternative: use smaller model (`ollama pull llama2-uncensored:7b-q4` = 4GB, faster on CPU)

## Alternative Models

If Llama 3.2 (3B) is too slow or resource-hungry, alternatives:

| Model | Size | Speed (CPU) | RAM | Command |
|-------|------|-------------|-----|---------|
| Llama 3.2 (1B) | 0.5B params | Very fast (~1s) | 2 GB | `ollama pull llama3.2:1b` |
| Phi 3.5 Mini | 0.5B params | Very fast (~1s) | 2 GB | `ollama pull phi3.5:3.8b` |
| Mistral (7B Q4) | 7B params (quantized) | Slower (~5s) | 4 GB | `ollama pull mistral:7b-q4` |
| Neural Chat | 7B params (quantized) | Slower (~5s) | 4 GB | `ollama pull neural-chat:7b-q4` |

To switch:
```bash
# Update .env
OLLAMA_MODEL=llama3.2:1b

# Pull new model
ollama pull llama3.2:1b

# Restart ollama serve
# Then test:
node workers/llm/test_ollama.js
```

## Data Privacy & Security

✓ All review text stays on your machine—never sent to external API
✓ Ollama runs as local service (http://localhost:11434)
✓ No telemetry or logging to third-party services
✓ Model weights cached locally after first pull

For production, consider:
- Running Ollama in isolated container (Podman/Docker)
- Restricting network access to Ollama endpoint (firewall)
- Logging all enrichment calls to audit trail (optional)

## Next Steps

1. **Enable in Yelp Fetcher**: Update `workers/crawlers/yelp_fetcher.ts` to call `parseReview()` on each Yelp review before persistence
2. **Add Tests**: Extend `workers/llm/test_ollama.js` with real reviews from your database
3. **Monitor Performance**: Log enrichment latency to understand batch-processing opportunities
4. **Integrate Trust Score**: Use extracted sentiment to weight the trust score calculation (see `docs/TRUST_SCORE.md`)
