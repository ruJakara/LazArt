# 🚀 Запуск проекта без Telegram бота

Этот скрипт запускает только основные сервисы (API, Frontend, Worker) без Telegram бота.

## 📋 Варианты запуска

### Вариант 1: Windows (.bat)

```bash
# Дважды кликните на файл или выполните в командной строке:
run-without-telegram.bat
```

### Вариант 2: Linux/macOS (.sh)

```bash
# Сделайте скрипт исполняемым
chmod +x run-without-telegram.sh

# Запустите
./run-without-telegram.sh
```

### Вариант 3: Docker Compose

```bash
# Запуск через Docker Compose
docker-compose -f docker/docker-compose.no-bot.yml up -d

# Просмотр логов
docker-compose -f docker/docker-compose.no-bot.yml logs -f

# Остановка
docker-compose -f docker/docker-compose.no-bot.yml down
```

## 🔧 Что запускается

| Сервис      | Порт      | Описание                    |
|-------------|-----------|-----------------------------|
| **API**     | 3000      | NestJS бэкенд               |
| **Frontend**| 5173      | React веб-приложение         |
| **Worker**  | -         | Фоновые задачи (Bull/Redis) |
| **PostgreSQL**| 5432    | База данных                 |
| **Redis**   | 6379      | Кэш и очереди задач         |

## 📡 Доступ к сервисам

- **Frontend:** http://localhost:5173
- **API Health:** http://localhost:3000/api/health
- **PostgreSQL:** localhost:5432 (postgres/password)
- **Redis:** localhost:6379

## ⚡ Быстрый старт (Docker)

```bash
# 1. Скопируйте .env.example в .env
copy .env.example .env

# 2. Запустите Docker Compose
docker-compose -f docker/docker-compose.no-bot.yml up -d

# 3. Откройте браузерер
http://localhost:5173
```

## 🛑 Остановка

### Windows (.bat)
Закройте все открытые окна терминала.

### Linux/macOS (.sh)
Нажмите `Ctrl+C` в терминале.

### Docker
```bash
docker-compose -f docker/docker-compose.no-bot.yml down
```

## 🐛 Частые проблемы

### Port 3000 уже занят
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

### Ошибка подключения к базе данных
Убедитесь, что PostgreSQL запущен:
```bash
# Docker
docker-compose -f docker/docker-compose.no-bot.yml ps

# Или проверьте логи
docker-compose -f docker/docker-compose.no-bot.yml logs postgres
```

### Module not found
Удалите node_modules и переустановите:
```bash
# Windows
rmdir /s /q node_modules
npm install

# Linux/macOS
rm -rf node_modules
npm install
```
