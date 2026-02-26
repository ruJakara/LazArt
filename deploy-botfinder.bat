@echo off
echo Deploying botfinder...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash botfinder/deploy.sh"
pause
