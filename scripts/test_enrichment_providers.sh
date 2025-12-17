#!/bin/bash
# Test enrichment with different LLM providers
# Usage: ./scripts/test_enrichment_providers.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║              Testing Enrichment with Multiple LLM Providers                 ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Test sample review
TEST_REVIEW="Marco gave me an amazing fade! Best barber in the city. Highly recommend."

echo "Test Review: \"$TEST_REVIEW\""
echo ""

# Test with Ollama
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing with OLLAMA (llama3.2:3b)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
export LLM_PROVIDER=ollama
node -e "
const { parseReview } = require('./workers/llm/review_parser.js');
(async () => {
  try {
    const result = await parseReview('$TEST_REVIEW', 'Test Shop');
    console.log('Provider: ollama');
    console.log('Names:', result.names);
    console.log('Sentiment:', result.sentiment);
    console.log('Summary:', result.summary);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
"
echo ""

# Test with OpenAI (if API key available)
if [ -n "$OPENAI_API_KEY" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Testing with OPENAI (gpt-4o-mini)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  export LLM_PROVIDER=openai
  node -e "
const { parseReview } = require('./workers/llm/review_parser.js');
(async () => {
  try {
    const result = await parseReview('$TEST_REVIEW', 'Test Shop');
    console.log('Provider: openai');
    console.log('Names:', result.names);
    console.log('Sentiment:', result.sentiment);
    console.log('Summary:', result.summary);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
"
  echo ""
else
  echo "⚠️  Skipping OpenAI test (OPENAI_API_KEY not set)"
  echo ""
fi

# Test with Mock
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing with MOCK (deterministic)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
export LLM_PROVIDER=mock
node -e "
const { parseReview } = require('./workers/llm/review_parser.js');
(async () => {
  try {
    const result = await parseReview('$TEST_REVIEW', 'Test Shop');
    console.log('Provider: mock');
    console.log('Names:', result.names);
    console.log('Sentiment:', result.sentiment);
    console.log('Summary:', result.summary);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
"
echo ""

echo "✅ Multi-provider enrichment test complete!"
echo ""
echo "To use a specific provider with enrichment worker:"
echo "  LLM_PROVIDER=openai npm run enrich"
echo "  LLM_PROVIDER=ollama npm run enrich"
echo "  LLM_PROVIDER=mock npm run enrich"
