#!/usr/bin/env bash
# Builds every workspace package from the repository root so dependency order is shared.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

pnpm build
