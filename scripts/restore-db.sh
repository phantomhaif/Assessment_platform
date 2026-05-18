#!/bin/bash
# Восстановление дампа БД из Railway
# Использование: ./scripts/restore-db.sh backup.dump

set -e

DUMP_FILE=${1:?Укажи путь к файлу дампа: ./scripts/restore-db.sh backup.dump}

echo "=== Копирую дамп в контейнер ==="
docker compose cp "$DUMP_FILE" postgres:/tmp/backup.dump

echo "=== Восстанавливаю БД ==="
docker compose exec postgres pg_restore \
  -U postgres \
  -d assessment_platform \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  /tmp/backup.dump

echo "=== Готово! БД восстановлена ==="
