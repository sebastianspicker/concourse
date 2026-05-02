#!/bin/bash
# Campus App Kit - Development Setup Script
# Run this script to set up the development environment

set -euo pipefail

echo "🚀 Campus App Kit - Development Setup"
echo "======================================"

# Check for required tools
echo ""
echo "📋 Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 20+"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js version 20+ is required. Current: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

if ! command -v pnpm &>/dev/null; then
  echo "❌ pnpm is not installed. Installing..."
  npm install -g pnpm@9
fi
echo "✅ pnpm $(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Create .env files if they don't exist
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
else
  echo "✅ .env already exists"
fi

if [ ! -f apps/bff/.env ]; then
  echo "Creating apps/bff/.env from apps/bff/.env.example..."
  cp apps/bff/.env.example apps/bff/.env
else
  echo "✅ apps/bff/.env already exists"
fi

if [ ! -f apps/mobile/.env ]; then
  echo "Creating apps/mobile/.env from apps/mobile/.env.example..."
  cp apps/mobile/.env.example apps/mobile/.env
else
  echo "✅ apps/mobile/.env already exists"
fi

# Build packages
echo ""
echo "🔨 Building packages..."
pnpm build

# Run typecheck
echo ""
echo "🔍 Running typecheck..."
pnpm typecheck

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit apps/bff/.env and set INSTITUTION_ID (default: hfmt)"
echo "   2. Edit apps/mobile/.env and set EXPO_PUBLIC_BFF_BASE_URL"
echo "   3. Run 'pnpm dev' to start BFF and the mobile dev-client workflow"
echo "   4. For Expo Go, run 'pnpm --filter @campus/mobile start' instead"
echo ""
echo "📚 Documentation:"
echo "   - README.md for quick start"
echo "   - docs/runbook.md for detailed configuration"
echo "   - docs/architecture.md for design overview"
