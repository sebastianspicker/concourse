#!/bin/bash
# Bootstraps the pinned local toolchain, private env copies, and compiled workspace.

set -euo pipefail

echo "Concourse Campus Kit development setup"

# Validate prerequisites before creating local files or installing dependencies.
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
  echo "ERROR: Corepack is required to run pnpm 9.0.0."
  exit 1
fi
pnpm_command=(corepack pnpm@9.0.0)
echo "pnpm: $("${pnpm_command[@]}" --version)"

# Use Corepack directly so setup does not mutate a global pnpm installation.
echo ""
echo "Installing dependencies..."
"${pnpm_command[@]}" install --frozen-lockfile

# Copy public templates only when a developer has not created local configuration.
echo ""
echo "Setting up environment files..."

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
else
  echo ".env already exists; leaving it unchanged."
fi

if [ ! -f apps/bff/.env ]; then
  echo "Creating apps/bff/.env from apps/bff/.env.example..."
  cp apps/bff/.env.example apps/bff/.env
else
  echo "apps/bff/.env already exists; leaving it unchanged."
fi

if [ ! -f apps/mobile/.env ]; then
  echo "Creating apps/mobile/.env from apps/mobile/.env.example..."
  cp apps/mobile/.env.example apps/mobile/.env
else
  echo "apps/mobile/.env already exists; leaving it unchanged."
fi

# Compile shared packages and applications once to expose setup problems early.
echo ""
echo "Building packages..."
"${pnpm_command[@]}" build

# Finish with the same type boundary used by CI.
echo ""
echo "Running typecheck..."
"${pnpm_command[@]}" typecheck

echo ""
echo "Setup complete."
echo ""
echo "Next steps:"
echo "   1. Edit apps/bff/.env and confirm INSTITUTION_ID"
echo "   2. Edit apps/mobile/.env and set EXPO_PUBLIC_BFF_BASE_URL"
echo "   3. Run 'corepack pnpm@9.0.0 dev' for an installed development client"
echo "   4. For Expo Go, run the BFF and mobile start command in separate terminals"
echo ""
echo "Documentation:"
echo "   - README.md for quick start"
echo "   - docs/runbook.md for detailed configuration"
echo "   - docs/architecture.md for design overview"
