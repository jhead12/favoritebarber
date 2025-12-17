# MCP LLM Integration Test Results

## Overview
The MCP (Model Context Protocol) exposes LLM-enriched data through a secure, authenticated API gateway. This integration test suite validates that the LLM enrichment pipeline works correctly through the MCP interface.

## Test Results: ✅ 9/9 PASSING

**Test Suite**: `tests/integration/test_mcp_llm.js`
**Duration**: ~33 seconds
**LLM Provider**: mock (configurable via `LLM_PROVIDER` env var)

## Architecture

```
Client → MCP API Gateway → LLM Client → Provider (Mock/OpenAI/Ollama/etc.)
         ↓                   ↓
    Authentication      Extract Names
    Rate Limiting       Analyze Sentiment
    Telemetry          Summarize Reviews
         ↓                   ↓
    Database ← Persist Enrichment
```

## Endpoint Tested

### `GET /api/mcp/enrich/reviews`

**Parameters**:
- `barber_id` (integer) - Enrich reviews for specific barber
- `shop_id` (integer) - Enrich reviews for all barbers at shop  
- `limit` (integer, default 5, max 50) - Number of reviews to process

**Authentication**: Requires valid MCP API key (Bearer token)

**Response**:
```json
{
  "count": 2,
  "results": [
    {
      "review_id": 123,
      "barber_id": 45,
      "created_at": "2025-12-16T...",
      "rating": 5,
      "names": ["Mike", "Carlos"],
      "sentiment": 0.85,
      "summary": "Amazing fade! Best haircut..."
    }
  ]
}
```

## LLM Processing

The endpoint performs 3 LLM operations per review:

1. **Name Extraction**: `llm.extractNamesFromReview(text)`
   - Returns: `["Mike", "Carlos"]` or `[]`
   - Stored in: `reviews.extracted_names`

2. **Sentiment Analysis**: `llm.analyzeSentiment(text)`
   - Returns: Number (typically -1 to 1, or 0-5 scale depending on provider)
   - Stored in: `reviews.enriched_sentiment`

3. **Summary Generation**: `llm.summarizeReview(text, maxWords)`
   - Returns: String (concise review summary)
   - Stored in: `reviews.review_summary`

## Database Persistence

Enrichment results are automatically persisted:
```sql
UPDATE reviews 
SET extracted_names = $1, 
    review_summary = $2, 
    enriched_at = NOW() 
WHERE id = $3
```

## Test Coverage

✅ **Basic Functionality**
- Enriches reviews by `barber_id`
- Enriches reviews by `shop_id` (all barbers at shop)
- Persists enrichment to database
- Respects `limit` parameter

✅ **Security & Validation**
- Requires authentication (401 without token)
- Rejects missing parameters (400 error)

✅ **Edge Cases**
- Handles non-existent barber gracefully (empty results)
- Handles shop with no barbers (404 error)

✅ **Provider Configuration**
- Documents current LLM provider settings
- Configurable timeout and retry settings

## Configuration

### Environment Variables

```bash
# LLM Provider (default: ollama)
LLM_PROVIDER=mock|openai|anthropic|ollama|huggingface|replicate

# Timeout for LLM operations (default: 12000ms)
LLM_TIMEOUT_MS=12000

# Max retries on failure (default: 1)
LLM_MAX_RETRIES=1

# Fallback providers (comma-separated)
LLM_PROVIDER_FALLBACK=openai,anthropic,ollama
```

### Database Requirements

Tables used:
- `mcp_partners` - Partner authentication
- `mcp_api_keys` - API key storage (bcrypt hashed)
- `reviews` - Review data with enrichment columns
- `barbers` - Barber profiles
- `shops` - Shop information
- `shop_barbers` - Barber-shop associations

## Running the Tests

### Quick Test (Mock Provider)
```bash
cd /Volumes/PRO-BLADE/Github/RateYourBarber
DATABASE_URL=postgresql://postgres:password@localhost:5432/rateyourbarber_test \
LLM_PROVIDER=mock \
node --test tests/integration/test_mcp_llm.js
```

### With Real LLM (Ollama)
```bash
# Start Ollama service first
ollama serve &

DATABASE_URL=postgresql://postgres:password@localhost:5432/rateyourbarber_test \
LLM_PROVIDER=ollama \
LLM_MODEL=llama3.2 \
node --test tests/integration/test_mcp_llm.js
```

### With OpenAI
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/rateyourbarber_test \
LLM_PROVIDER=openai \
OPENAI_API_KEY=sk-... \
node --test tests/integration/test_mcp_llm.js
```

## Performance

**Mock Provider** (for testing):
- ~2-4 seconds per enrichment (10 reviews)
- No external API calls
- Deterministic output

**Real LLM Providers**:
- OpenAI: ~1-2 seconds per review
- Ollama (local): ~3-5 seconds per review (depends on hardware)
- Anthropic: ~1-3 seconds per review

**Optimizations**:
- Reviews are processed sequentially (not parallel) to respect rate limits
- Timeout per operation: 12 seconds
- Best-effort persistence (won't fail if DB update fails)

## Error Handling

The endpoint is resilient:

1. **LLM Failures**: If name extraction fails, returns empty array
2. **Sentiment Failures**: If sentiment fails, returns 0
3. **Summary Failures**: If summary fails, returns truncated text
4. **DB Persistence Failures**: Logged but doesn't fail request

This ensures partial enrichment is always returned even if some operations fail.

## Integration with Frontend

The MCP enrichment endpoint enables frontend features:

1. **Search**: Use extracted names to match barbers in reviews
2. **Ratings**: Display sentiment scores alongside star ratings
3. **Previews**: Show AI-generated summaries instead of full text
4. **Filtering**: Filter by sentiment (positive/negative reviews)

## Next Steps

To integrate with frontend:

1. **Get MCP API Key**: Create partner account and generate API key
2. **Make Request**: 
   ```javascript
   const response = await fetch(
     'http://localhost:3000/api/mcp/enrich/reviews?barber_id=123&limit=10',
     {
       headers: {
         'Authorization': `Bearer ${MCP_API_KEY}`
       }
     }
   );
   const { count, results } = await response.json();
   ```

3. **Display Results**: Use `names`, `sentiment`, `summary` fields in UI

4. **Cache Results**: Enrichment is stored in database, no need to re-process

## Troubleshooting

**Tests timing out?**
- Increase `LLM_TIMEOUT_MS`
- Check LLM provider is running (e.g., `ollama serve`)

**Authentication errors?**
- Ensure API server is running on port 3000
- Check `mcp_partners` table has test data

**Database errors?**
- Run migrations: `npm --prefix api run migrate`
- Verify database connection string

**LLM errors?**
- Check `LLM_PROVIDER` is valid
- For Ollama: ensure model is pulled (`ollama pull llama3.2`)
- For OpenAI: verify API key is valid

## Related Tests

- `tests/integration/test_mcp_e2e.js` - MCP authentication & endpoints (8/8 passing)
- `tests/unit/test_mcp_auth.js` - MCP authentication logic (12/12 passing)
- `tests/unit/test_mcp_rate_limiter.js` - Rate limiting (9/10 passing)

**Total MCP Test Coverage**: 38/39 tests passing (97.4%)
