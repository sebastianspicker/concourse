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
    forbidden_files+=("$path")
  done < <(git ls-files -z | git check-ignore --no-index -z --stdin)

  if (( ${#forbidden_files[@]} > 0 )); then
    echo "Tracked files must not match .gitignore:"
    printf '  %s\n' "${forbidden_files[@]}"
    exit 1
  fi
}

verify_public_tree

# Require the reviewed runtime evidence to exist. CI also proves that every
# expected image belongs to the candidate commit.
expected_screenshots=(
  docs/screenshots/concourse-event-detail-390-light.png
  docs/screenshots/concourse-event-detail-1440-light.png
  docs/screenshots/concourse-events-1440-light.png
  docs/screenshots/concourse-rooms-1440-light.png
  docs/screenshots/concourse-rooms-320-light.png
  docs/screenshots/concourse-settings-1440-light.png
  docs/screenshots/concourse-settings-768-high-contrast-de.png
  docs/screenshots/concourse-today-1600-light.png
  docs/screenshots/concourse-today-390-light.png
)

verify_screenshot_set() {
  local actual expected path

  expected="$(printf '%s\n' "${expected_screenshots[@]}" | LC_ALL=C sort)"
  if [[ -d docs/screenshots ]]; then
    actual="$(find docs/screenshots -maxdepth 1 -type f -name '*.png' -print | LC_ALL=C sort)"
  else
    actual=""
  fi
  if [[ "$actual" != "$expected" ]]; then
    echo "Runtime screenshot evidence must contain exactly:"
    printf '  %s\n' "${expected_screenshots[@]}"
    echo "Found:"
    if [[ -n "$actual" ]]; then
      while IFS= read -r path; do printf '  %s\n' "$path"; done <<< "$actual"
    else
      echo "  (none)"
    fi
    exit 1
  fi

  for path in "${expected_screenshots[@]}"; do
    if [[ ! -s "$path" ]]; then
      echo "Runtime screenshot is missing or empty: $path"
      exit 1
    fi
  done

  if [[ -n "${CI:-}" ]]; then
    if ! git ls-files --error-unmatch -- "${expected_screenshots[@]}" >/dev/null 2>&1; then
      echo "Every runtime screenshot must be tracked in the candidate commit."
      exit 1
    fi
  fi
}

verify_screenshot_set

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  pnpm install --frozen-lockfile
fi
pnpm release:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
verify_screenshot_set

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
