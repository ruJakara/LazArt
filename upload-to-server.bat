@echo off
echo Uploading deploy scripts to server...

REM Копируем deploy-all.sh в /opt/bots/
scp deploy-all.sh root@89.191.225.207:/opt/bots/
if errorlevel 1 (
    echo Failed to upload deploy-all.sh
    pause
    exit /b 1
)

REM Делаем скрипт исполняемым
ssh root@89.191.225.207 "chmod +x /opt/bots/deploy-all.sh"

REM Копируем service файлы
scp bot_project\kiberone-bot.service root@89.191.225.207:/opt/bots/bot_project/
scp botfinder\bot-stable1.7\kiberone-botfinder.service root@89.191.225.207:/opt/bots/botfinder/

REM Копируем deploy.sh скрипты
scp bot_project\deploy.sh root@89.191.225.207:/opt/bots/bot_project/
scp botfinder\bot-stable1.7\deploy.sh root@89.191.225.207:/opt/bots/botfinder/

echo.
echo ====================================
echo Upload complete!
echo ====================================
echo.
echo Next steps on server:
echo   1. Install services:
echo      scp bot_project\kiberone-bot.service root@89.191.225.207:/etc/systemd/system/
echo      scp botfinder\bot-stable1.7\kiberone-botfinder.service root@89.191.225.207:/etc/systemd/system/
echo.
echo   2. Or run deploy-all.sh:
echo      ssh root@89.191.225.207
echo      /opt/bots/deploy-all.sh
echo.
pause
