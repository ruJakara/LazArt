#!/bin/bash
set -e

echo "🚀 Deploying all bots from LazArt monorepo..."

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

# --- BotFinder ---
echo ""
echo "🔄 Deploying botfinder..."
cd /opt/bots/lazart/botfinder
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate

if systemctl list-unit-files | grep -q "kiberone-botfinder.service"; then
  systemctl restart kiberone-botfinder.service
  echo "✅ botfinder deployed"
else
  echo "⚠️  kiberone-botfinder.service not found, skipping restart"
fi

# --- Night Hunger ---
echo ""
echo "🔄 Deploying night-hunger..."
cd /opt/bots/lazart/night-hunger
chmod +x deploy-bot.sh
./deploy-bot.sh
echo "✅ night-hunger deployed"

echo ""
echo "🎉 All bots updated!"
