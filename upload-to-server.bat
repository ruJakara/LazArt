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

REM Гарантируем директорию для group_parser
ssh root@89.191.225.207 "mkdir -p /opt/bots/lazart/group_parser"

REM Копируем service файлы
scp bot_project\kiberone-bot.service root@89.191.225.207:/opt/bots/lazart/bot_project/
scp botfinder\kiberone-botfinder.service root@89.191.225.207:/opt/bots/lazart/botfinder/
scp group_parser\kiberone-group-parser.service root@89.191.225.207:/opt/bots/lazart/group_parser/

REM Копируем deploy.sh скрипты
scp bot_project\deploy.sh root@89.191.225.207:/opt/bots/lazart/bot_project/
scp botfinder\deploy.sh root@89.191.225.207:/opt/bots/lazart/botfinder/
scp group_parser\deploy.sh root@89.191.225.207:/opt/bots/lazart/group_parser/

REM Делаем скрипты исполняемыми
ssh root@89.191.225.207 "chmod +x /opt/bots/lazart/bot_project/deploy.sh /opt/bots/lazart/botfinder/deploy.sh /opt/bots/lazart/group_parser/deploy.sh"

REM Копируем .env файлы (они gitignored, не попадают через git pull)
echo Uploading .env files...
scp botfinder\.env root@89.191.225.207:/opt/bots/lazart/botfinder/.env
ssh root@89.191.225.207 "chmod 600 /opt/bots/lazart/botfinder/.env"

REM Копируем .env для night-hunger
echo Uploading night-hunger .env...
scp night-hunger\.env root@89.191.225.207:/opt/bots/lazart/night-hunger/.env
ssh root@89.191.225.207 "chmod 600 /opt/bots/lazart/night-hunger/.env"

REM Копируем .env для group_parser (если есть)
if exist group_parser\.env (
    echo Uploading group_parser .env...
    scp group_parser\.env root@89.191.225.207:/opt/bots/lazart/group_parser/.env
    ssh root@89.191.225.207 "chmod 600 /opt/bots/lazart/group_parser/.env"
) else (
    echo [WARN] group_parser\.env not found, skipping upload.
)

REM Копируем шаблон reverse proxy для night-hunger
echo Uploading night-hunger nginx template...
ssh root@89.191.225.207 "mkdir -p /opt/bots/lazart/night-hunger/deploy/nginx"
scp night-hunger\deploy\nginx\night-hunger.conf.example root@89.191.225.207:/opt/bots/lazart/night-hunger/deploy/nginx/night-hunger.conf.example

REM Устанавливаем service файлы в systemd
ssh root@89.191.225.207 "cp /opt/bots/lazart/bot_project/kiberone-bot.service /etc/systemd/system/ && cp /opt/bots/lazart/botfinder/kiberone-botfinder.service /etc/systemd/system/ && cp /opt/bots/lazart/group_parser/kiberone-group-parser.service /etc/systemd/system/ && systemctl daemon-reload"

echo.
echo ====================================
echo Upload complete!
echo ====================================
echo.
echo Services installed and systemd reloaded.
echo Night Hunger nginx template uploaded to /opt/bots/lazart/night-hunger/deploy/nginx/night-hunger.conf.example
echo Run deploy-all.bat after updating env files (night-hunger and group_parser).
echo.
pause
