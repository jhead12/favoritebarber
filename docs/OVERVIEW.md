# RateYourBarber — Project Overview

Purpose
- RateYourBarber collects and enriches barbershop reviews and photos to surface high-quality barber/shop profiles and searchable, scored results.

Primary components
- `api/` — Node API server, DB migrations, seeding, and AI prompt templates.
- `web/` — Next.js frontend for browsing/searching barbers and shops.
- `workers/` & `ml-worker/` — Background jobs handling ingestion, image analysis, embeddings, and LLM enrichment.
- `api/migrations/` — SQL schema definitions (barbers, locations, reviews, images, embeddings, users, scoring).

Tech stack
- Backend: Node.js, Postgres, Redis
- Frontend: Next.js (React)
- AI: Local LLMs (Ollama) or remote LLMs; Google Cloud Vision for images (recommended)
- Dev: Docker/Podman compose for local full-stack runs

Developer quickstart

1. Copy environment file

```bash
cp .env.example .env
# edit .env with DB and API keys
```

2. Start services (recommended)

```bash
docker compose up --build
```

3. Run migrations and seed (API)

```bash
cd api
npm install
node migrate.js
node seed.js
node index.js
```

4. Run frontend

```bash
cd web
npm install
npm run dev
```

Testing notes
- There is no single `npm test` across the monorepo; many tests are runnable scripts. Example commands:

```bash
node workers/test_hairstyle_vision.js
node workers/test_e2e_hairstyle_workflow.js --dry-run
node workers/llm/test_ai_accuracy.js
node api/test_review_parser.js
```

Where to extend
- Add DB migrations to `api/migrations/`.
- Put LLM prompts in `api/ai/prompts/` and log LLM exchanges to `api/ai/logs/`.
- Keep workers idempotent and append-only for raw snapshot ingestion.

Privacy & safety
- Do not infer protected attributes (ethnicity, nationality) from images. Allow only self-declared fields on claimed profiles.

Next steps
- Add CI to run key tests and migrations automatically.
- Improve barber-name extraction and sentiment accuracy in `workers/llm/`.
