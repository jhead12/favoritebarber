#!/usr/bin/env bash
set -euo pipefail

echo "Starting dev environment using Podman (required)..."

if command -v podman >/dev/null 2>&1; then
	if podman compose version >/dev/null 2>&1; then
		echo "Using: podman compose up --build"
		podman compose up --build
		exit 0
	fi
	if command -v podman-compose >/dev/null 2>&1; then
		echo "Using: podman-compose up --build"
		podman-compose up --build
		exit 0
	fi
fi

echo "Error: Podman or Podman Compose is required but not found on PATH. Install Podman and ensure 'podman compose' or 'podman-compose' is available."
exit 1
