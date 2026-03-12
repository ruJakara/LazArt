# 🚀 Как запустить Night Hunger: Vampire Evo

## 📋 Варианты запуска

### Вариант 1: Быстрый старт (Docker) ⭐ Рекомендуемый

**Требования:**
- Docker Desktop для Windows
- 2 GB свободной RAM

**Запуск:**

```bash
# 1. Перейди в директорию проекта
cd c:\Users\Admin\Desktop\Проект\wisdom

# 2. Скопируй .env.example в .env
copy .env.example .env

# 3. Отредактируй .env (обязательные переменные):
# - TELEGRAM_BOT_TOKEN=получи_у_BotFather
# - JWT_SECRET=любая_секретная_строка

# 4. Запусти все сервисы через Docker
docker-compose -f docker/docker-compose.dev.yml up -d

# 5. Проверь статус
docker-compose -f docker/docker-compose.dev.yml ps
```

**Доступ:**
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

### Вариант 2: Локальная разработка

**Требования:**
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

#### Шаг 1: Установка зависимостей

```bash
# Перейди в директорию проекта
cd c:\Users\Admin\Desktop\Проект\wisdom

# Установи зависимости для всех пакетов
npm install

# Установи зависимости для API
cd services\api
npm install

# Установи зависимости для Web
cd ..\..\apps\web
npm install

# Установи зависимости для бота
cd ..\bot
pip install -r requirements.txt (если есть) или npm install
```

#### Шаг 2: Настройка окружения

```bash
# Вернись в корень проекта
cd c:\Users\Admin\Desktop\Проект\wisdom

# Скопируй .env.example в .env
copy .env.example .env
```

**Отредактируй `.env`:**

```env
# Обязательно замени:
TELEGRAM_BOT_TOKEN=1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP

# База данных (если PostgreSQL локально):
DATABASE_URL=postgresql://postgres:password@localhost:5432/night_hunger

# Redis (если локально):
REDIS_URL=redis://localhost:6379

# JWT секрет:
JWT_SECRET=my_super_secret_key_12345
```

#### Шаг 3: Запуск PostgreSQL и Redis

**Способ A: Через Docker (рекомендуется)**

```bash
docker run -d --name night_hunger_db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=night_hunger \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d --name night_hunger_redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Способ B: Локальная установка**

- Скачай PostgreSQL: https://www.postgresql.org/download/windows/
- Скачай Redis для Windows: https://github.com/microsoftarchive/redis/releases

#### Шаг 4: Запуск сервисов

**Терминал 1: API (NestJS)**

```bash
cd c:\Users\Admin\Desktop\Проект\wisdom\services\api
npm run dev
```

**Терминал 2: Frontend (React)**

```bash
cd c:\Users\Admin\Desktop\Проект\wisdom\apps\web
npm run dev
```

**Терминал 3: Бот (Python)**

```bash
cd c:\Users\Admin\Desktop\Проект\wisdom\apps\bot
python src\main.py
```

**Терминал 4: Worker (опционально)**

```bash
cd c:\Users\Admin\Desktop\Проект\wisdom\services\worker
npm run dev
```

---

### Вариант 3: Production (Docker Compose)

```bash
# 1. Настрой .env для production
# 2. Запусти production конфигурацию
docker-compose -f docker/docker-compose.prod.yml up -d --build

# 3. Проверь логи
docker-compose -f docker/docker-compose.prod.yml logs -f
```

---

## 🔧 Настройка Telegram Bot

### 1. Создай бота

1. Открой @BotFather в Telegram
2. Отправь `/newbot`
3. Введи имя бота: `Night Hunger Bot`
4. Введи username: `night_hunger_bot`
5. Скопируй токен

### 2. Настрой WebApp

1. Отправь @BotFather команду `/mybots`
2. Выбери своего бота
3. Bot Settings → Menu Button → Configure Menu Button
4. Отправь URL: `https://your-domain.com` или `http://localhost:5173` (для тестов)
5. Введи название: `Play`

### 3. Обнови .env

```env
TELEGRAM_BOT_TOKEN=1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP
TELEGRAM_WEBAPP_URL=http://localhost:5173
```

---

## 🧪 Проверка работы

### 1. Проверь API

```bash
curl http://localhost:3000/api/health
```

Ожидаемый ответ: `{"status": "ok"}`

### 2. Проверь Frontend

Открой в браузере: http://localhost:5173

### 3. Проверь бота

1. Открой своего бота в Telegram
2. Нажми `/start`
3. Должна появиться кнопка "Play"

---

## 🐛 Частые проблемы

### Ошибка: "Cannot find module"

```bash
# Удали node_modules и package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Переустанови зависимости
npm install
```

### Ошибка: "Connection refused" к PostgreSQL

```bash
# Проверь, запущен ли PostgreSQL
docker ps | grep postgres

# Или перезапусти контейнер
docker restart night_hunger_db
```

### Ошибка: "Invalid token"

Проверь `.env`:
```env
TELEGRAM_BOT_TOKEN=правильный_токен_без_пробелов
```

### Ошибка: "Port 3000 already in use"

```bash
# Найди процесс на порту 3000
netstat -ano | findstr :3000

# Убий процесс
taskkill /PID <PID> /F

# Или измени порт в .env
PORT=3001
```

---

## 📊 Мониторинг

### Логи сервисов

```bash
# API
docker-compose -f docker/docker-compose.dev.yml logs -f api

# Web
docker-compose -f docker/docker-compose.dev.yml logs -f web

# Бот
docker-compose -f docker/docker-compose.dev.yml logs -f bot
```

### Метрики

Запусти мониторинг:

```bash
docker-compose -f docker/docker-compose.monitoring.yml up -d
```

- **Grafana:** http://localhost:3001 (admin/admin123)
- **Prometheus:** http://localhost:9090

---

## 🧹 Остановка

```bash
# Останови Docker контейнеры
docker-compose -f docker/docker-compose.dev.yml down

# Останови с удалением данных (осторожно!)
docker-compose -f docker/docker-compose.dev.yml down -v
```

---

## 📚 Дополнительная документация

- [API Documentation](docs/API.md)
- [User Manual](docs/USER_MANUAL.md)
- [Architecture](ARCHITECTURE.md)
- [Sprint 5 Report](SPRINT_5_REPORT.md)

---

## ⚡ Команды для разработки

```bash
# Запуск всех сервисов
npm run dev

# Запуск отдельных сервисов
npm run dev:api    # API
npm run dev:web    # Frontend
npm run dev:worker # Worker

# Сборка
npm run build

# Тесты
npm run test       # Unit тесты
npm run test:e2e   # E2E тесты
npm run test:cov   # С покрытием

# Линтинг
npm run lint
npm run format
```

---

**🎉 Готово! Игра запущена!**

Открой бота в Telegram и нажми кнопку "Play" для начала игры.
