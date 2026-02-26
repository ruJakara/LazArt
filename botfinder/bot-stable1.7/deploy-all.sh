#!/bin/bash
set -e  # остановка при ошибке

# Список всех проектов (добавляй новые строки)
PROJECTS=("bot_project" "botfinder")

for PROJECT in "${PROJECTS[@]}"; do
  echo "🔄 Deploying $PROJECT..."
  
  cd "/opt/bots/$PROJECT" || { echo "❌ $PROJECT not found"; continue; }
  git pull origin main || echo "⚠️ Git pull failed for $PROJECT"
  
  source venv/bin/activate
  pip install -r requirements.txt --quiet || echo "⚠️ Pip install failed for $PROJECT"
  
  # Имя сервиса = kiberone-<имя_проекта_с_дефисом>
  if [ "$PROJECT" == "bot_project" ]; then
    SERVICE_NAME="kiberone-bot.service"
  else
    SERVICE_NAME="kiberone-$(echo $PROJECT | sed 's/_/-/g').service"
  fi
  systemctl restart $SERVICE_NAME
  
  echo "✅ $PROJECT deployed"
done

echo "🎉 All bots updated!"
