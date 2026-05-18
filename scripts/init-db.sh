#!/bin/bash
# Initialize a clean DB: apply Prisma schema and run seed data.
# Versions are pinned to avoid accidental Prisma 7+ downloads via npx.

set -euo pipefail

PRISMA_VERSION="${PRISMA_VERSION:-5.22.0}"
TSX_VERSION="${TSX_VERSION:-4.21.0}"
SCHEMA_PATH="${SCHEMA_PATH:-prisma/schema.prisma}"

echo "=== Applying schema with prisma@${PRISMA_VERSION} ==="
docker compose exec --user root app sh -lc "npx -y prisma@${PRISMA_VERSION} db push --skip-generate --schema ${SCHEMA_PATH}"

echo "=== Running seed with tsx@${TSX_VERSION} ==="
docker compose exec --user root app sh -lc "npx -y tsx@${TSX_VERSION} prisma/seed.ts"

echo "=== Done ==="
