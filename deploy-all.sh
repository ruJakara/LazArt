#!/bin/bash
set -e

echo "🚀 Deploying core projects from LazArt monorepo..."

cd /opt/bots/lazart || { echo "❌ /opt/bots/lazart not found"; exit 1; }

# Pull latest code
git pull origin main

# --- Bot Project ---
echo ""
echo "🔄 Deploying bot_project..."
cd /opt/bots/lazart/bot_project
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate

if systemctl list-unit-files | grep -q "kiberone-bot.service"; then
  systemctl restart kiberone-bot.service
  echo "✅ bot_project deployed"
else
  echo "⚠️  kiberone-bot.service not found, skipping restart"
fi

# --- Group Parser ---
echo ""
echo "🔄 Deploying group_parser..."
cd /opt/bots/lazart/group_parser
GROUP_PARSER_ENV_FILE="/opt/bots/lazart/group_parser/.env"

if [ ! -d venv ]; then
  echo "ℹ️ Creating venv for group_parser..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate

group_parser_can_restart=1
for key in TELEGRAM_BOT_TOKEN PAYMENT_PROVIDER_TOKEN VK_TOKEN; do
  value="$(grep -E "^${key}=" "$GROUP_PARSER_ENV_FILE" 2>/dev/null | tail -n 1 | cut -d'=' -f2- || true)"
  if [ -z "$value" ] || [ "$value" = "your_bot_token_here" ] || [ "$value" = "your_payment_provider_token_here" ] || [ "$value" = "vk1.a.your_vk_token_here" ]; then
    echo "⚠️  $key is missing in $GROUP_PARSER_ENV_FILE. Skip service restart."
    group_parser_can_restart=0
  fi
done

if systemctl list-unit-files | grep -q "kiberone-group-parser.service"; then
  if [ "$group_parser_can_restart" -eq 1 ]; then
    systemctl restart kiberone-group-parser.service
    echo "✅ group_parser deployed"
  else
    echo "⚠️  group_parser dependencies updated, service restart skipped."
  fi
else
  echo "⚠️  kiberone-group-parser.service not found, skipping restart"
fi

# --- Night Hunger ---
echo ""
echo "🔄 Deploying night-hunger..."
cd /opt/bots/lazart/night-hunger
chmod +x deploy-bot.sh
./deploy-bot.sh
echo "✅ night-hunger deployed"

echo ""
echo "🎉 Core projects updated (bot_project + group_parser + night-hunger)!"
