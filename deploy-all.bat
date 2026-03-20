@echo off
echo Deploying core projects (bot_project + group_parser + night-hunger)...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash deploy-all.sh"
pause
