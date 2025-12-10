SHELL := /bin/bash
.PHONY: up down build migrate seed logs

# Use Podman compose if available, otherwise docker compose
COMPOSE := $(shell if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then echo podman compose; elif command -v podman >/dev/null 2>&1 && command -v podman-compose >/dev/null 2>&1; then echo podman-compose; else echo; fi)

up:
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "ERROR: Podman is required. Install Podman and try again."; exit 1; \
	fi
	@echo "Bringing up services with: $(COMPOSE) up --build"
	$(COMPOSE) up --build -d

down:
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "ERROR: Podman is required. Install Podman and try again."; exit 1; \
	fi
	@echo "Stopping services with: $(COMPOSE) down"
	$(COMPOSE) down

build:
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "ERROR: Podman is required. Install Podman and try again."; exit 1; \
	fi
	@echo "Building images with: $(COMPOSE) build"
	$(COMPOSE) build

migrate:
	@echo "Running DB migrations (api/migrate.js)"
	@cd api && node migrate.js

seed:
	@echo "Seeding DB (api/seed.js)"
	@cd api && node seed.js

logs:
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "ERROR: Podman is required. Install Podman and try again."; exit 1; \
	fi
	@echo "Showing service logs (use CTRL+C to exit)"
	$(COMPOSE) logs -f
