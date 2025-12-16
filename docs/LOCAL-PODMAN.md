Local Podman setup and notes
===========================

Quick start (macOS)

1. Initialize and start Podman VM:

```bash
podman machine init
podman machine start
```

2. Start the stack (Podman):

```bash
npm run dev:podman
```

Or using Docker (if you prefer):

```bash
npm run dev:docker
```

Notes and gotchas
- Port conflicts: `docker-compose` maps Postgres `5432`, Redis `6379`, API `3000`, and web `3001` on the host. If you already run local Postgres/Redis, change the host port mapping in `docker-compose.yml` before starting.
- Podman on macOS uses a VM; verify the machine is running (`podman machine list`). Port forwarding may behave slightly differently than Docker Desktop.
- Native modules: the API uses native modules (e.g., `bcrypt`). The API Dockerfile now installs Alpine build tools (`build-base`, `python3`) so `npm ci` can compile native code. If builds still fail, consider switching the `api/Dockerfile` base image to a Debian-based Node image (`node:18-bullseye`) or replace `bcrypt` with a pure-JS alternative.
- Volumes and permissions: running Podman rootless can surface UID/permission issues on host bind mounts. Prefer named volumes for DB data (already used: `pgdata`).

Troubleshooting
- If ports fail to bind, check for local services and stop them or change the mapping in `docker-compose.yml`.
- To rebuild after Dockerfile changes:

```bash
npm run down
npm run dev:podman
```

Further reading
- See `docker-compose.yml` and individual `Dockerfile` files in `api/`, `web/`, and `workers/`.
