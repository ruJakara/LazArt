@echo off
echo Deploying bot_project...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash bot_project/deploy.sh"
pause
