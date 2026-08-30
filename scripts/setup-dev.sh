#!/bin/bash
set -euo pipefail

echo "Concourse Campus Kit development setup"

echo ""
echo "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js 22.13 or newer is required."
  exit 1
fi

IFS=. read -r NODE_MAJOR NODE_MINOR _ <<< "$(node -p 'process.versions.node')"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 13 ]; }; then
  echo "ERROR: Node.js 22.13 or newer is required. Current: $(node -v)"
  exit 1
fi
echo "Node.js: $(node -v)"

if ! command -v corepack &>/dev/null; then
  echo "ERROR: Corepack is required to run pnpm 9.15.0."
  exit 1
fi

# Give Turbo a Corepack pnpm shim as well as this script. Otherwise package
# scripts can resolve an unrelated globally installed pnpm.
corepack_bin_dir="$(mktemp -d "${TMPDIR:-/tmp}/concourse-corepack.XXXXXX")"
trap 'rm -rf "$corepack_bin_dir"' EXIT
corepack enable --install-directory "$corepack_bin_dir"
export PATH="$corepack_bin_dir:$PATH"

pnpm_command=(pnpm)
echo "pnpm: $("${pnpm_command[@]}" --version)"

echo ""
echo "Installing dependencies..."
"${pnpm_command[@]}" install --frozen-lockfile

echo ""
echo "Setting up environment files..."

if [ ! -f apps/api/.env ]; then
  echo "Creating apps/api/.env from apps/api/.env.example..."
  cp apps/api/.env.example apps/api/.env
else
  echo "apps/api/.env already exists; leaving it unchanged."
fi

if [ ! -f apps/client/.env ]; then
  echo "Creating apps/client/.env from apps/client/.env.example..."
  cp apps/client/.env.example apps/client/.env
else
  echo "apps/client/.env already exists; leaving it unchanged."
fi

echo ""
echo "Building packages..."
"${pnpm_command[@]}" build

echo ""
echo "Running typecheck..."
"${pnpm_command[@]}" typecheck

echo ""
echo "Setup complete."
echo ""
echo "Next steps:"
echo "   1. Edit apps/api/.env and confirm INSTITUTION_ID"
echo "   2. Edit apps/client/.env and set EXPO_PUBLIC_BFF_BASE_URL"
echo "   3. Run 'corepack pnpm@9.15.0 dev' for an installed development client"
echo "   4. For Expo Go, run the API and client start commands in separate terminals"
echo ""
echo "Documentation:"
echo "   - README.md for quick start"
echo "   - docs/runbook.md for detailed configuration"
echo "   - docs/architecture.md for design overview"
