#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  pnpm install --frozen-lockfile
fi
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:web
pnpm test:e2e

if [[ "${SKIP_MARKER_CHECK:-}" != "1" ]]; then
  marker_pattern='\b(TODO|FIXME|SKELETON|PLACEHOLDER|TBD)\b'
  if command -v rg >/dev/null 2>&1; then
    if rg -n "$marker_pattern" -S --hidden \
      --glob '!.git/**' \
      --glob '!node_modules/**' \
      --glob '!dist/**' \
      --glob '!build/**' \
      --glob '!coverage/**' \
      --glob '!.turbo/**' \
      --glob '!.expo/**' \
      --glob '!.expo-shared/**' \
      --glob '!.pnpm-store/**' \
      --glob '!.claude/**' \
      --glob '!AGENTS.md' \
      --glob '!docs/**' \
      --glob '!plans/**' \
      --glob '!progress.md' \
      --glob '!IMPLEMENTATION_BACKLOG.md' \
      --glob '!BUGS_AND_FIXES.md' \
      --glob '!verify-production-ready.sh' \
      .; then
      echo
      echo "Found TODO/FIXME/SKELETON/PLACEHOLDER/TBD markers. Resolve or document as \"won't do\"."
      exit 1
    fi
  elif grep -RIn -E "$marker_pattern" \
    --exclude-dir .git \
    --exclude-dir node_modules \
    --exclude-dir dist \
    --exclude-dir build \
    --exclude-dir coverage \
    --exclude-dir .turbo \
    --exclude-dir .expo \
    --exclude-dir .expo-shared \
    --exclude-dir .pnpm-store \
    --exclude-dir .claude \
    --exclude AGENTS.md \
    --exclude-dir docs \
    --exclude-dir plans \
    --exclude progress.md \
    --exclude IMPLEMENTATION_BACKLOG.md \
    --exclude BUGS_AND_FIXES.md \
    --exclude verify-production-ready.sh \
    .; then
    echo
    echo "Found TODO/FIXME/SKELETON/PLACEHOLDER/TBD markers. Resolve or document as \"won't do\"."
    exit 1
  fi
fi

echo "OK: production-ready checks passed."
