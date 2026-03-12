@echo off
echo Deploying night-hunger...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash night-hunger/deploy-bot.sh"
pause
