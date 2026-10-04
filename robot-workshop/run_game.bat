@echo off
setlocal
cd /d "%~dp0"
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" >nul 2>&1
if not errorlevel 1 (
    py -3 server.py
    goto end
)
python -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" >nul 2>&1
if not errorlevel 1 (
    python server.py
    goto end
)
echo Python 3.10 or newer is required. Install Python, then double-click this file again.
pause
exit /b 1
:end
if errorlevel 1 pause
