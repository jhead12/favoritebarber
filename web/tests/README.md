Playwright & Vitest tests

How to run (after installing dev dependencies):

```bash
# from repo root
cd web
npm install

# start dev server in another terminal
npm run dev

# run unit tests
npm run test:unit

# run e2e tests (Playwright)
npm run test:e2e
```

Notes:
- Tests assume a local dev server at http://localhost:3001 (Playwright config `baseURL`).
- The e2e tests look for a DOM element with `data-testid="hairstyles"` on barber and shop pages. Add this attribute to the UI where aggregated/detected hairstyles are rendered.
