Test directory

Smoke tests
- `tests/smoke/api_smoke.js` — lightweight Node script that pings the local API endpoints. Run from repository root:

```bash
API_BASE=http://localhost:3000 node tests/smoke/api_smoke.js
```

Integration tests
- `npm run test:integration` — existing integration test for the image processor. Ensure the API and workers are running and configured before running.
