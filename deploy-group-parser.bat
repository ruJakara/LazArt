@echo off
echo Deploying group_parser...
ssh root@89.191.225.207 "cd /opt/bots/lazart && bash group_parser/deploy.sh"
pause
