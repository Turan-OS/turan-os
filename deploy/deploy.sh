#!/usr/bin/env bash
# Обновление сайта на сервере: забрать код → пересобрать → перезапустить.
# Запуск: ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Забираю свежий код из GitHub…"
git pull origin main

echo "→ Пересобираю и перезапускаю контейнер…"
docker compose --env-file .env.production up -d --build

echo "→ Чищу старые образы…"
docker image prune -f >/dev/null 2>&1 || true

echo "✅ Готово. Сайт обновлён."
