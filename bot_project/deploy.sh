#!/bin/bash
cd /opt/bots/lazart || exit 1

git pull origin main

# Bot project
cd bot_project
source venv/bin/activate
pip install -r requirements.txt --quiet

systemctl restart kiberone-bot.service
echo "✅ Bot updated and restarted."
