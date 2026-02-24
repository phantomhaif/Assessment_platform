#!/bin/bash
# Apply database schema changes on startup
# This script runs once during deployment to sync the database schema

echo "Checking database schema..."

# Run prisma db push with accept-data-loss flag
# This will apply schema changes without creating migration files
npx prisma db push --accept-data-loss --skip-generate

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "✓ Database schema is up to date"
else
  echo "⚠ Database schema sync failed, but continuing with startup"
fi

# Always exit successfully to allow the app to start
exit 0
