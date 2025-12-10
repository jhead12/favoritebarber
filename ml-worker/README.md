ML Worker — optional service

This directory describes an optional ML worker service that can host heavier model workloads (training, custom inference, image models). The ML worker is intentionally optional for the MVP; the main app uses managed vision/LLM services by default.

How the compose file represents the service
- The root `docker-compose.yml` contains a commented-out `ml-worker` service block. To enable it, uncomment the block and ensure the `ml-worker/` folder contains a runnable service (see steps below).

Quick enable steps
1. Add the ML worker code in `ml-worker/`. A minimal example:
   - `ml-worker/app.py` — Flask or FastAPI app listening on port 5000
   - `ml-worker/requirements.txt` — Python deps
   - `ml-worker/Dockerfile` — build image (FROM python:3.11-slim etc.)

2. In the repo root, uncomment the `ml-worker` block in `docker-compose.yml`.

3. Start the stack (Podman required):

   podman compose up --build ml-worker

   or start the full stack:

   podman compose up --build

Configuration hints
- Environment variables to provide in `.env`:
  - `REDIS_URL` — for job queue or pub/sub
  - `DATABASE_URL` — if the worker writes back results
  - `MODEL_PATH` — optional path to local model files or mount an S3 bucket

Security & resource notes
- ML workers can be resource-intensive. Only enable on machines with sufficient CPU/RAM/GPU.
- When running on host or cloud, consider GPU base images and mounting `/dev/nvidia0` when appropriate.

Integration patterns
- HTTP: expose an endpoint like `/analyze` that the Node API or workers call for heavy inference.
- Queue: use Redis + Bull/Queue for job envelopes — the Node side enqueues, the ML worker consumes jobs.

If you want, I can scaffold a minimal `ml-worker/` with a Flask stub and Dockerfile and leave it commented in compose. Say the word and I will add it.
