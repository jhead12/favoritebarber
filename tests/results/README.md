# Test Results

This directory contains timestamped test results for LLM performance testing.

## Available Tests

### 1. OpenAI vs Ollama Comparison
**File Pattern**: `openai_vs_ollama_YYYYMMDD_HHMMSS.txt`

Tests 6 review cases against both providers to compare:
- Barber name recognition accuracy
- Sentiment analysis accuracy

**Latest Results** (Dec 16, 2025):
- **OpenAI (gpt-4o-mini)**: 66.7% name recognition, 100% sentiment
- **Ollama (llama3.2:3b)**: 50.0% name recognition, 100% sentiment
- **Winner**: OpenAI (+16.7% on name extraction)

### 2. Full AI Accuracy Test
**File Pattern**: `ai_accuracy_openai_YYYYMMDD_HHMMSS.txt` or `ai_accuracy_ollama_YYYYMMDD_HHMMSS.txt`

Comprehensive 8-test suite covering:
- Barber name extraction (clear names, ambiguous patterns, no names)
- Sentiment analysis (positive, negative, neutral, mixed)
- Fallback logic (shop names when barber not found)

**Latest Results with OpenAI** (Dec 16, 2025):
- Barber Name Recognition: **62.5%** (5/8)
- Sentiment Analysis: **75.0%** (6/8)
- Fallback Logic: **75.0%** (6/8)

**Latest Results with Ollama** (Previous runs):
- Barber Name Recognition: **62.5%** (5/8)
- Sentiment Analysis: **75.0%** (6/8)
- Fallback Logic: **75.0%** (6/8)

## How to Run Tests

### Quick Comparison Test (6 cases)
```bash
# With Ollama (local/free)
node workers/llm/test_openai_vs_ollama.js > tests/results/openai_vs_ollama_$(date +%Y%m%d_%H%M%S).txt

# With OpenAI (requires API key)
OPENAI_API_KEY="your-key" LLM_PROVIDER=openai node workers/llm/test_openai_vs_ollama.js > tests/results/openai_vs_ollama_$(date +%Y%m%d_%H%M%S).txt
```

### Full Accuracy Test (8 cases)
```bash
# With Ollama
node workers/llm/test_ai_accuracy.js > tests/results/ai_accuracy_ollama_$(date +%Y%m%d_%H%M%S).txt

# With OpenAI
OPENAI_API_KEY="your-key" LLM_PROVIDER=openai node workers/llm/test_ai_accuracy.js > tests/results/ai_accuracy_openai_$(date +%Y%m%d_%H%M%S).txt
```

## Key Findings

### Name Recognition
- **Both models struggle with**: 
  - Extracting "the", "was" instead of NONE when no name present
  - Complex patterns like "The barber, Tony"
- **OpenAI advantage**: Better at distinguishing personal names from common words

### Sentiment Analysis
- **Both models excel at**: Clear positive/negative sentiment (100% accuracy)
- **Both struggle with**: Subtle nuances ("exactly what I wanted" misclassified as neutral)

### Cost vs Accuracy Trade-off

| Provider | Cost | Name Accuracy | Sentiment Accuracy | Recommendation |
|----------|------|---------------|-------------------|----------------|
| Ollama | Free (local) | 50-62% | 75-100% | Best for MVP/privacy |
| OpenAI | ~$0.15/1M tokens | 62-67% | 75-100% | Best for production |

## Configuration

To switch providers, set in `.env`:
```bash
# Use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here

# Use Ollama (default)
LLM_PROVIDER=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Use Ollama with OpenAI fallback
LLM_PROVIDER=ollama
LLM_PROVIDER_FALLBACK=openai
```

## File Retention

- Keep latest 5 results per test type
- Archive older results to `tests/results/archive/` if needed
- Results are timestamped for easy tracking of improvements over time
