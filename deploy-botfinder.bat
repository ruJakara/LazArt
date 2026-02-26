@echo off
echo Deploying botfinder...
ssh root@89.191.225.207 "cd /opt/bots/botfinder && ./deploy.sh"
pause
