# Деплой BotFinder на сервер

## Инструкции по установке на сервер

### 1. Создать директорию и клонировать репозиторий

```bash
mkdir -p /opt/bots/botfinder
cd /opt/bots
git clone <URL_РЕПОЗИТОРИЯ_BOTFINDER> botfinder
cd botfinder
```

### 2. Создать виртуальное окружение

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Настроить переменные окружения

Создать файл `.env` в директории `/opt/bots/botfinder/`:

```bash
cp .env.example .env
nano .env
```

**Необходимые переменные:**
```
# Telegram Bot
TELEGRAM_BOT_TOKEN=8500861592:AAHj3wJBbsu_wJa2NlavcgoAwA-fDrByO6k
BOT_PASSWORD=1

# Perplexity API (LLM для анализа новостей)
PERPLEXITY_API_KEY=pplx-xxx
PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online

# Настройки приложения
CHECK_INTERVAL_MINUTES=30
MAX_ARTICLES_PER_CHECK=50
RELEVANCE_THRESHOLD=0.3

# Логирование и БД
LOG_LEVEL=INFO
DB_PATH=news_monitor.db
```

### 4. Установить systemd service

```bash
cp kiberone-botfinder.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable kiberone-botfinder.service
systemctl start kiberone-botfinder.service
```

### 5. Скопировать deploy-all.sh в общую директорию

```bash
cp deploy-all.sh /opt/bots/
chmod +x /opt/bots/deploy-all.sh
```

### 6. Проверить статус

```bash
systemctl status kiberone-botfinder.service
journalctl -u kiberone-botfinder.service -f
```

### 7. Проверить все боты

```bash
systemctl status kiberone-bot.service kiberone-botfinder.service
```

---

## Обновление (deploy)

### Вариант 1: Обновить все боты сразу

```bash
/opt/bots/deploy-all.sh
```

Или в VSCode: `Ctrl+Shift+B` → **Deploy All Bots**

### Вариант 2: Обновить один проект

```bash
cd /opt/bots/botfinder
./deploy.sh
```

---

## Универсальное управление (1–10 ботов)

### Структура на сервере

```
/opt/bots/
├── bot_project/          # первый бот (игры)
├── botfinder/            # второй бот (новости ЖКХ)
├── bot3_project/         # будущие боты
├── deploy-all.sh         # универсальный скрипт деплоя
```

### Скрипт deploy-all.sh

```bash
#!/bin/bash
set -e

# Список всех проектов
PROJECTS=("bot_project" "botfinder")

for PROJECT in "${PROJECTS[@]}"; do
  echo "🔄 Deploying $PROJECT..."
  cd "/opt/bots/$PROJECT"
  git pull origin main
  source venv/bin/activate
  pip install -r requirements.txt --quiet
  
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
```

### VSCode Tasks

В каждом проекте есть `.vscode/tasks.json`:

| Задача | Описание |
|--------|----------|
| **Deploy All Bots** | Обновить все боты сразу |
| **Deploy bot_project** | Обновить первый проект |
| **Deploy botfinder** | Обновить второй проект |
| **Status all bots** | Показать статус всех сервисов |

---

## Структура на сервере

```
/opt/bots/
├── bot_project/          # Первый проект (Kiberone Bot)
│   ├── venv/
│   ├── main.py
│   └── ...
├── botfinder/            # Второй проект (PRS Bot)
│   ├── venv/
│   ├── main.py
│   ├── config.py
│   ├── sources.json
│   └── ...
```

---

## Порты

- **bot_project**: порт 10000 (вебхук Telegram)
- **botfinder**: не требует внешнего порта (polling режим)
