#!/usr/bin/env bash
# Reproduces the main CI job with a frozen install followed by the source-alpha gate.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm install --frozen-lockfile
SKIP_INSTALL=1 ./scripts/verify-production-ready.sh
