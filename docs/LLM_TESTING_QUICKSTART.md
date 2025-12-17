# Quick Start: Running LLM Tests

This guide shows you how to run LLM tests and generate result files.

## 🚀 Quick Commands

### Option 1: Using npm (Recommended)
```bash
# Show available tests
npm run test:llm

# Compare OpenAI vs Ollama (6 tests)
npm run test:llm:comparison

# Full accuracy test with Ollama (8 tests)
npm run test:llm:accuracy

# Full accuracy test with OpenAI (8 tests)
npm run test:llm:openai

# Run all tests
npm run test:llm:all
```

### Option 2: Using the script directly
```bash
# Show help
./scripts/run_llm_tests.sh

# Compare providers
./scripts/run_llm_tests.sh comparison

# Test with Ollama
./scripts/run_llm_tests.sh accuracy ollama

# Test with OpenAI
./scripts/run_llm_tests.sh accuracy openai

# Run everything
./scripts/run_llm_tests.sh all
```

## 📁 Where Results Are Saved

All test results are automatically saved to `tests/results/` with timestamps:

```
tests/results/
├── openai_vs_ollama_20251216_184345.txt    # Comparison test
├── ai_accuracy_ollama_20251216_183000.txt  # Full test (Ollama)
├── ai_accuracy_openai_20251216_184039.txt  # Full test (OpenAI)
└── README.md                                # Results documentation
```

## 📊 View Results

```bash
# View latest results
ls -lht tests/results/*.txt | head -5

# View specific result file
cat tests/results/openai_vs_ollama_20251216_184345.txt

# View just the summary
tail -50 tests/results/ai_accuracy_openai_20251216_184039.txt
```

## ⚙️ Configuration

### Using OpenAI
Make sure your `.env` file has:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
LLM_PROVIDER=openai  # Optional: set as default
```

### Using Ollama (Free/Local)
Make sure Ollama is running:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve

# Make sure model is pulled
ollama pull llama3.2:3b
```

## 🎯 What Each Test Does

### Comparison Test (`test:llm:comparison`)
- **Tests**: 6 review cases
- **Providers**: Both OpenAI and Ollama
- **Measures**: Name recognition and sentiment analysis
- **Duration**: ~30 seconds
- **Output**: Side-by-side comparison with accuracy percentages

### Accuracy Test (`test:llm:accuracy`)
- **Tests**: 8 comprehensive review cases
- **Providers**: Your choice (Ollama or OpenAI)
- **Measures**: Name extraction, sentiment, fallback logic
- **Duration**: ~45 seconds
- **Output**: Detailed test breakdown with pass/fail for each metric

### All Tests (`test:llm:all`)
- **Tests**: Everything above
- **Providers**: All available (Ollama + OpenAI if configured)
- **Duration**: ~2 minutes
- **Output**: Multiple result files

## 📈 Understanding Results

### Name Recognition
- ✅ **Good (>70%)**: Model correctly identifies barber names
- ⚠️ **Fair (50-70%)**: Some names missed or false positives
- ❌ **Poor (<50%)**: Many errors, consider better prompts or model

### Sentiment Analysis
- ✅ **Good (>90%)**: Accurately detects positive/negative/neutral
- ⚠️ **Fair (70-90%)**: Some mixed sentiments misclassified
- ❌ **Poor (<70%)**: Unreliable, needs improvement

### Typical Results
| Provider | Name Recognition | Sentiment | Cost |
|----------|-----------------|-----------|------|
| Ollama (llama3.2:3b) | 50-62% | 75-100% | Free |
| OpenAI (gpt-4o-mini) | 62-67% | 75-100% | ~$0.15/1M tokens |

## 🔧 Troubleshooting

### "OPENAI_API_KEY not configured"
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-proj-your-key-here`
3. Run test again

### "Ollama not available"
1. Install: `brew install ollama`
2. Pull model: `ollama pull llama3.2:3b`
3. Start server: `ollama serve`
4. Run test again

### "Permission denied"
```bash
chmod +x scripts/run_llm_tests.sh
```

## 💡 Pro Tips

1. **Run tests before major changes** to establish baseline
2. **Keep 3-5 recent results** for tracking improvements over time
3. **Use comparison test** for quick checks during development
4. **Use accuracy test** for comprehensive validation before deployment
5. **Archive old results** to `tests/results/archive/` to keep directory clean

## 📞 Need Help?

See detailed documentation:
- Test implementation: `workers/llm/test_ai_accuracy.js`
- Results README: `tests/results/README.md`
- LLM client code: `workers/llm/llm_client.js`
