#!/usr/bin/env bash
# Runs the complete source-alpha gate and fails closed on public-tree or scanner errors.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# Reject tracked files that violate the repository's ignore policy.
verify_public_tree() {
  local -a forbidden_files=()
  local path

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Public-tree verification requires a Git worktree."
    exit 1
  fi

  while IFS= read -r -d '' path; do
    if [[ ( -e "$path" || -L "$path" ) ]] && git check-ignore --no-index --quiet -- "$path"; then
      forbidden_files+=("$path")
    fi
  done < <(git ls-files -z)

  if (( ${#forbidden_files[@]} > 0 )); then
    echo "Tracked files must not match .gitignore:"
    printf '  %s\n' "${forbidden_files[@]}"
    exit 1
  fi
}

verify_public_tree
pnpm check:architecture

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  pnpm install --frozen-lockfile
fi
pnpm release:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

if [[ "${SKIP_MARKER_CHECK:-}" != "1" ]]; then
  marker_pattern='\b(TODO|FIXME|SKELETON|PLACEHOLDER|TBD)\b'
  if command -v rg >/dev/null 2>&1; then
    set +e
    rg -n "$marker_pattern" -S --hidden \
      --glob '!.git/**' \
      --glob '!node_modules/**' \
      --glob '!dist/**' \
      --glob '!build/**' \
      --glob '!coverage/**' \
      --glob '!.turbo/**' \
      --glob '!.expo/**' \
      --glob '!.expo-shared/**' \
      --glob '!.pnpm-store/**' \
      --glob '!docs/**' \
      --glob '!verify-production-ready.sh' \
      .
    marker_status=$?
    set -e
    if (( marker_status == 0 )); then
      echo
      echo "Found TODO/FIXME/SKELETON/PLACEHOLDER/TBD markers. Resolve or document as \"won't do\"."
      exit 1
    elif (( marker_status != 1 )); then
      echo "Marker scan failed with status ${marker_status}."
      exit "$marker_status"
    fi
  else
    set +e
    grep -RIn -E "$marker_pattern" \
      --exclude-dir .git \
      --exclude-dir node_modules \
      --exclude-dir dist \
      --exclude-dir build \
      --exclude-dir coverage \
      --exclude-dir .turbo \
      --exclude-dir .expo \
      --exclude-dir .expo-shared \
      --exclude-dir .pnpm-store \
      --exclude-dir docs \
      --exclude verify-production-ready.sh \
      .
    marker_status=$?
    set -e
    if (( marker_status == 0 )); then
      echo
      echo "Found TODO/FIXME/SKELETON/PLACEHOLDER/TBD markers. Resolve or document as \"won't do\"."
      exit 1
    elif (( marker_status != 1 )); then
      echo "Marker scan failed with status ${marker_status}."
      exit "$marker_status"
    fi
  fi
fi

echo "OK: source-alpha release gate passed."
