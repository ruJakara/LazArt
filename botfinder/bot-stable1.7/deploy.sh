#!/bin/bash
cd /opt/bots/botfinder || exit 1

git pull
source venv/bin/activate
pip install -r requirements.txt

systemctl restart kiberone-botfinder.service
echo "BotFinder updated and restarted."
