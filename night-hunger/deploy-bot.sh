#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "[ERROR] Docker Compose не найден. Установите docker compose plugin или docker-compose." >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[ERROR] Не найден compose-файл: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Не найден env-файл: $ENV_FILE" >&2
  echo "Создайте .env (например, cp .env.example .env) и заполните TELEGRAM_BOT_TOKEN." >&2
  exit 1
fi

token_line="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | tail -n 1 || true)"
token_value="${token_line#TELEGRAM_BOT_TOKEN=}"
if [[ -z "$token_value" || "$token_value" == "your_bot_token_here" ]]; then
  echo "[ERROR] TELEGRAM_BOT_TOKEN отсутствует или содержит плейсхолдер в $ENV_FILE" >&2
  exit 1
fi

echo "[INFO] Проверка Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon недоступен. Запустите Docker и повторите." >&2
  exit 1
fi

echo "[INFO] Запуск production стека (always-on bot)..."
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "[INFO] Текущий статус сервисов:"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

bot_container_id="$("${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q bot || true)"
if [[ -n "$bot_container_id" ]]; then
  bot_state="$(docker inspect --format '{{.State.Status}}' "$bot_container_id" 2>/dev/null || true)"
  bot_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$bot_container_id" 2>/dev/null || true)"
  bot_restarts="$(docker inspect --format '{{.RestartCount}}' "$bot_container_id" 2>/dev/null || true)"

  echo "[INFO] bot_state=${bot_state:-unknown}"
  echo "[INFO] bot_health=${bot_health:-unknown}"
  echo "[INFO] bot_restart_count=${bot_restarts:-unknown}"
fi

echo "[INFO] Последние логи bot (tail=60):"
"${COMPOSE_CMD[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=60 bot

echo "[OK] Deploy завершён."
