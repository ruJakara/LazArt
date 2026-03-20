@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден в PATH.
  echo Установите Python 3.10+ и отметьте "Add python.exe to PATH".
  pause
  exit /b 1
)

python -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 (
  echo Не удалось установить зависимости.
  pause
  exit /b 1
)

if "%TELEGRAM_BOT_TOKEN%"=="" (
  echo Не задан TELEGRAM_BOT_TOKEN.
  echo Установите переменную и запустите снова.
  echo Пример:
  echo set TELEGRAM_BOT_TOKEN=123456:ABCDEF
  pause
  exit /b 1
)

if "%VK_TOKEN%"=="" (
  echo Не задан VK_TOKEN.
  echo Установите переменную и запустите снова.
  echo Пример:
  echo set VK_TOKEN=vk1.a.xxxxx
  pause
  exit /b 1
)

if "%PAYMENT_PROVIDER_TOKEN%"=="" (
  echo Не задан PAYMENT_PROVIDER_TOKEN.
  echo Установите токен платежного провайдера Telegram Payments.
  echo Пример:
  echo set PAYMENT_PROVIDER_TOKEN=381764678:TEST:12345
  pause
  exit /b 1
)

python "%~dp0telegram_parser_bot.py"
if errorlevel 1 (
  echo Ошибка запуска Telegram-бота.
  pause
)
