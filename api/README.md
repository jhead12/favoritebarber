API notes

Podman notes

If you're using Podman locally you can run the full stack with:

	podman compose up --build

This repo requires Podman for local compose-based development. Use the Makefile helpers (which expect Podman):

	make up
	make migrate
	make seed

Run migrations: `node migrate.js` (requires `DATABASE_URL` in env)
Seed sample data: `node seed.js`
Start dev server: `npm run dev`
