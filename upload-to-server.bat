@echo off
echo Uploading deploy scripts and service files to server...

REM Копируем deploy-all.sh в /opt/bots/lazart/
scp deploy-all.sh root@89.191.225.207:/opt/bots/lazart/
if errorlevel 1 (
    echo Failed to upload deploy-all.sh
    pause
    exit /b 1
)

REM Делаем скрипт исполняемым
ssh root@89.191.225.207 "chmod +x /opt/bots/lazart/deploy-all.sh"

REM Копируем service файлы
scp bot_project\kiberone-bot.service root@89.191.225.207:/opt/bots/lazart/bot_project/
scp botfinder\kiberone-botfinder.service root@89.191.225.207:/opt/bots/lazart/botfinder/

REM Копируем deploy.sh скрипты
scp bot_project\deploy.sh root@89.191.225.207:/opt/bots/lazart/bot_project/
scp botfinder\deploy.sh root@89.191.225.207:/opt/bots/lazart/botfinder/

REM Делаем скрипты исполняемыми
ssh root@89.191.225.207 "chmod +x /opt/bots/lazart/bot_project/deploy.sh /opt/bots/lazart/botfinder/deploy.sh"

REM Копируем .env файлы (они gitignored, не попадают через git pull)
echo Uploading .env files...
scp botfinder\.env root@89.191.225.207:/opt/bots/lazart/botfinder/.env
ssh root@89.191.225.207 "chmod 600 /opt/bots/lazart/botfinder/.env"

REM Устанавливаем service файлы в systemd
ssh root@89.191.225.207 "cp /opt/bots/lazart/bot_project/kiberone-bot.service /etc/systemd/system/ && cp /opt/bots/lazart/botfinder/kiberone-botfinder.service /etc/systemd/system/ && systemctl daemon-reload"

echo.
echo ====================================
echo Upload complete!
echo ====================================
echo.
echo Services installed and systemd reloaded.
echo Run deploy-all.bat to deploy both bots.
echo.
pause
