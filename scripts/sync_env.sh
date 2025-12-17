#!/usr/bin/env bash
set -euo pipefail

# Sync root .env to common subprojects to avoid maintaining multiple files.
# Usage: ./scripts/sync_env.sh [target1 target2 ...]  # defaults: api workers web

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"
EXCLUDE_FILE_1="$ROOT_DIR/.env.exclude"
EXCLUDE_FILE_2="$(dirname "$0")/sync_env.exclude"

# Initialize
env_lines=()
declare -A exclude_keys

# Load excludes from .env.exclude (root) or scripts/sync_env.exclude (script dir)
if [[ -f "$EXCLUDE_FILE_1" ]]; then
  while IFS= read -r l || [[ -n "$l" ]]; do
    if [[ -z "$l" || "$l" =~ ^\s*# ]]; then
      continue
    fi
    k=$(echo "$l" | awk -F= '{print $1}' | xargs)
    exclude_keys["$k"]=1
  done < "$EXCLUDE_FILE_1"
fi
if [[ -f "$EXCLUDE_FILE_2" ]]; then
  while IFS= read -r l || [[ -n "$l" ]]; do
    if [[ -z "$l" || "$l" =~ ^\s*# ]]; then
      continue
    fi
    k=$(echo "$l" | awk -F= '{print $1}' | xargs)
    exclude_keys["$k"]=1
  done < "$EXCLUDE_FILE_2"
fi

# Load excludes from SYNC_ENV_EXCLUDE env var (comma-separated keys)
if [[ -n "${SYNC_ENV_EXCLUDE-}" ]]; then
  IFS=',' read -ra _keys <<< "$SYNC_ENV_EXCLUDE"
  for kk in "${_keys[@]}"; do
    kk_trim=$(echo "$kk" | xargs)
    exclude_keys["$kk_trim"]=1
  done
fi

if [[ ! -f "$ROOT_ENV" ]]; then
  echo "Root .env not found at $ROOT_ENV"
  exit 1
fi

DEFAULT_TARGETS=("api" "workers" "web")
TARGETS=()

if [[ $# -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=("${DEFAULT_TARGETS[@]}")
fi

echo "Syncing $ROOT_ENV to targets: ${TARGETS[*]}"

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and empty lines
  if [[ -z "$line" || "$line" =~ ^\s*# ]]; then
    continue
  fi
  # Extract key (before first '=')
  key=$(echo "$line" | awk -F= '{print $1}' | xargs)
  if [[ -n "${exclude_keys[$key]-}" ]]; then
    echo "- Skipping excluded key: $key"
    continue
  fi
  env_lines+=("$line")
done < "$ROOT_ENV"

for t in "${TARGETS[@]}"; do
  TARGET_DIR="$ROOT_DIR/$t"
  if [[ ! -d "$TARGET_DIR" ]]; then
    echo "- Skipping missing target: $t"
    continue
  fi

  TARGET_ENV="$TARGET_DIR/.env"
  if [[ -f "$TARGET_ENV" ]]; then
    BACKUP="$TARGET_ENV.bak.$(date +%s)"
    echo "- Backing up existing $TARGET_ENV -> $BACKUP"
    cp -a "$TARGET_ENV" "$BACKUP"
  fi

  echo "- Writing $TARGET_ENV"
  printf "%s\n" "${env_lines[@]}" > "$TARGET_ENV"
done

echo "Sync complete. Review backups ending with .bak.<timestamp> if needed."
