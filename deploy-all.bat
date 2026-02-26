@echo off
echo Deploying all bots...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash deploy-all.sh"
pause
