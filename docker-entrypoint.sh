#!/bin/sh
set -e

echo "🏠 Starting FamilyHub..."

# Run database migrations
echo "📦 Running database migrations..."
pnpm db:migrate || echo "⚠️  Migration failed or already up to date"

# Start the application
echo "🚀 Starting server..."
exec node .output/server/index.mjs
