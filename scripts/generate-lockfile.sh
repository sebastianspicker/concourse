#!/usr/bin/env bash
# Regenerates the workspace lockfile after an intentional dependency change.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm install

if [[ ! -f pnpm-lock.yaml ]]; then
  echo "pnpm-lock.yaml was not generated."
  exit 1
fi

echo "Generated pnpm-lock.yaml. Commit it to keep installs deterministic."
