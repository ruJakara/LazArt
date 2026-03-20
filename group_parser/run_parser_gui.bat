@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден в PATH.
  echo Установите Python 3.10+ и отметьте "Add python.exe to PATH".
  pause
  exit /b 1
)

python -c "import vk_api" >nul 2>nul
if errorlevel 1 (
  echo Устанавливаю зависимость vk_api...
  python -m pip install vk_api
  if errorlevel 1 (
    echo Не удалось установить vk_api.
    pause
    exit /b 1
  )
)

python "%~dp0vk_live_parser_gui.py"
if errorlevel 1 (
  echo Ошибка запуска GUI.
  pause
)
