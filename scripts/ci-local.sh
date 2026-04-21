#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm install --frozen-lockfile
SKIP_INSTALL=1 ./scripts/verify-production-ready.sh
