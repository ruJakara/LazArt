@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ============================================================
echo   Night Hunger - Bot Only Mode
echo ============================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%apps\bot"

set "PYTHON_CMD="
where py >nul 2>nul
if !errorlevel! equ 0 (
    py -3 -c "import sys" >nul 2>nul
    if !errorlevel! equ 0 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYTHON_CMD=python"
    ) else (
        echo [ERROR] Python was not found. Install Python 3.12+ and retry.
        pause
        exit /b 1
    )
)

echo [INFO] Using interpreter: %PYTHON_CMD%
for /f %%v in ('%PYTHON_CMD% -c "import sys; print(str(sys.version_info.major)+chr(46)+str(sys.version_info.minor))"') do set "PY_VER=%%v"
echo [INFO] Python version: !PY_VER!

if not exist ".tmp" mkdir ".tmp"
set "TMP=%CD%\.tmp"
set "TEMP=%CD%\.tmp"

if exist "%ROOT_DIR%.env" (
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B /C:"TELEGRAM_BOT_TOKEN=" /C:"TELEGRAM_WEBAPP_URL=" "%ROOT_DIR%.env"`) do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

echo [1/3] Checking bot dependencies...
%PYTHON_CMD% -c "import aiogram, aiohttp" >nul 2>nul
if %errorlevel% neq 0 (
    echo [2/3] Installing bot dependencies...
    %PYTHON_CMD% -m pip install --disable-pip-version-check --user -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

if "%TELEGRAM_BOT_TOKEN%"=="" (
    echo [2/3] TELEGRAM_BOT_TOKEN is not set.
    set /p TELEGRAM_BOT_TOKEN=Enter Telegram bot token: 
)

echo.
echo [3/3] Starting Telegram bot...
if "%TELEGRAM_WEBAPP_URL%"=="" (
    echo TELEGRAM_WEBAPP_URL is not set ^(safe mode: no external WebApp open^)
) else (
    echo TELEGRAM_WEBAPP_URL=%TELEGRAM_WEBAPP_URL%
)
echo.
%PYTHON_CMD% src\main.py
