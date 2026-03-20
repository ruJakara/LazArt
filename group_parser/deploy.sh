#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SERVICE_NAME="kiberone-group-parser.service"
ENV_FILE="$ROOT_DIR/.env"

cd "$MONOREPO_DIR" || exit 1
git pull origin main

cd "$ROOT_DIR" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 not found. Install Python 3.10+ and retry."
  exit 1
fi

if [[ ! -d venv ]]; then
  echo "ℹ️ Creating virtual environment for group_parser..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate

can_restart_service=1
for key in TELEGRAM_BOT_TOKEN PAYMENT_PROVIDER_TOKEN VK_TOKEN; do
  value="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -n 1 | cut -d'=' -f2- || true)"
  if [[ -z "$value" || "$value" == "your_bot_token_here" || "$value" == "your_payment_provider_token_here" || "$value" == "vk1.a.your_vk_token_here" ]]; then
    echo "⚠️  $key is missing in $ENV_FILE. Skip service restart."
    can_restart_service=0
  fi
done

if systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
  if [[ "$can_restart_service" -eq 1 ]]; then
    systemctl restart "$SERVICE_NAME"
    echo "✅ group_parser updated and restarted."
  else
    echo "⚠️  $SERVICE_NAME not restarted until .env is configured."
  fi
else
  echo "⚠️  $SERVICE_NAME not found, dependencies updated only."
fi
