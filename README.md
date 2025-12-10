# Rate Your Barber — Scaffold

This repository contains a scaffold for the Rate Your Barber app. It is an initial layout with placeholders for the frontend (`web/`), API (`api/`), background workers (`workers/`), and database migrations (`api/migrations/`).

What this scaffold includes
- Frontend stubs (`web/`) — pages and components for search and profile views
- API stubs (`api/`) — basic route handlers and contract docs
- Worker stubs (`workers/`) — Yelp fetcher, image processor, geocoder
- Migration skeletons (`api/migrations/`) — SQL create table stubs
- Dev tooling: `docker-compose.yml`, `.env.example`, and a simple `scripts/dev.sh`

Next steps

1. Provide API keys in `.env` and run the development environment using Podman.

Podman quickstart
- Start services:

	podman compose up --build

- Stop services:

	podman compose down

Developer helpers
- Use the included Makefile for convenience (requires Podman):

	make up
	make migrate
	make seed

Local LLM Setup (Ollama + Llama 3.2)

For privacy-first text analysis (name extraction, sentiment, summarization), this repo includes integration with Ollama, a local LLM runtime. Follow these steps to enable local Llama inference:

1. **Install Ollama** (macOS/Linux/Windows):
   - Download from https://ollama.ai
   - macOS: `brew install ollama` (or use the DMG installer)
   - Verify: `ollama --version`

2. **Pull the Llama 3.2 (3B) model**:

	ollama pull llama3.2:3b

   This downloads the 3B parameter model (~2GB), optimized for CPU-only inference.

3. **Run Ollama server** (keep running in a separate terminal during dev):

	ollama serve

   This starts the Ollama API on `http://localhost:11434` by default.

4. **Set environment variables** in `.env`:

	OLLAMA_ENDPOINT=http://localhost:11434
	OLLAMA_MODEL=llama3.2:3b

   These are already in `.env.example`; copy to `.env` if not present.

5. **Test the integration**:

	cd /path/to/RateYourBarber
	node workers/llm/test_ollama.js

   Expected output:
   - ✓ Ollama is reachable at http://localhost:11434
   - Sentiment scores (0.0–1.0) and extracted names from sample reviews
   - If Ollama is unavailable, functions gracefully fall back to heuristics

6. **How it's used** in the pipeline:
   - `workers/llm/ollama_client.js` — Core Ollama interface with heuristic fallbacks
   - `workers/llm/review_parser.js` — Wrapper for batch review parsing
   - Review enrichment: The Yelp fetcher can call `parseReview()` to extract sentiment, names, and summaries from reviews without sending data to external APIs.

If Ollama is not running, all LLM functions degrade to local heuristics (regex NER, keyword sentiment, truncation) automatically. No data is ever sent outside your machine.

2. Implement crawler logic in `workers/crawlers/yelp_fetcher.ts` and run workers.
3. Implement API endpoints and wire database connection.


