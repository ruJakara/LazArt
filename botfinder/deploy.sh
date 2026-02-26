#!/bin/bash
cd /opt/bots/lazart || exit 1

git pull origin main

# BotFinder
cd botfinder
source venv/bin/activate
pip install -r requirements.txt --quiet

systemctl restart kiberone-botfinder.service
echo "✅ BotFinder updated and restarted."
