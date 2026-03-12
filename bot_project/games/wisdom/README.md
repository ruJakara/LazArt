# Night Hunger: Vampire Evo

Telegram Mini Game с механикой охоты, прокачки и PvP.

## ⚡ Bot-Only режим (временно)

Для быстрого локального теста без API/Worker/DB:

```bash
run-bot-only.bat
```

Нужно только:
- `TELEGRAM_BOT_TOKEN`
- (опционально) `TELEGRAM_WEBAPP_URL`

## 📋 Содержание

- [Технологический стек](#технологический-стек)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Разработка](#разработка)
- [Деплой](#деплой)
- [Документация](#документация)

## 🛠 Технологический стек

### Frontend
- React 18+ (Vite)
- TypeScript 5+
- Tailwind CSS 3+
- Telegram WebApp SDK
- Zustand (state management)
- Framer Motion (анимации)

### Backend
- NestJS 10+
- TypeScript 5+
- PostgreSQL 15+ (с индексами)
- Redis 7+ (кэш, rate limiting)
- TypeORM
- Bull (очереди)

### Telegram Bot
- Python 3.11+
- Aiogram 3+

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Prometheus + Grafana (мониторинг)
- Helmet (security headers)

## 📁 Структура проекта

```
night-hunger/
├── apps/                  # Приложения
│   ├── web/              # React frontend
│   └── bot/              # Python Telegram bot
├── services/             # Backend сервисы
│   ├── api/              # NestJS API
│   └── worker/           # Фоновые задачи
├── packages/             # Общие пакеты
│   ├── shared/           # Общие типы и утилиты
│   └── game-core/        # Игровая логика и формулы
├── docker/               # Docker конфигурации
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── docker-compose.monitoring.yml
│   ├── prometheus.yml
│   └── backup.sh
├── docs/                 # Документация
│   ├── API.md
│   ├── USER_MANUAL.md
│   └── DEPLOYMENT.md
├── .github/workflows/    # CI/CD
│   └── ci-cd.yml
└── SPRINT_5_REPORT.md   # Отчёт о спринте
```

## 🚀 Быстрый старт

### Требования
- Node.js >= 18
- Python >= 3.11
- PostgreSQL >= 15
- Redis >= 7
- Docker (опционально)

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd night-hunger
```

2. Установите зависимости:
```bash
npm install
```

3. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

4. Заполните `.env` необходимыми значениями

5. Запустите Docker контейнеры (PostgreSQL + Redis):
```bash
docker-compose -f docker/docker-compose.dev.yml up -d
```

6. Запустите проект в режиме разработки:
```bash
npm run dev
```

## 👨‍💻 Разработка

### Отдельный запуск сервисов

```bash
# Backend API
npm run dev:api

# Frontend
npm run dev:web

# Worker (фоновые задачи)
npm run dev:worker
```

### Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие
npm run test:cov
```

### Линтинг и форматирование

```bash
npm run lint
npm run format
```

## 📦 Деплой

### Production (Docker Compose)

```bash
# Запуск production
docker-compose -f docker/docker-compose.prod.yml up -d

# Запуск мониторинга
docker-compose -f docker/docker-compose.monitoring.yml up -d

# Проверка здоровья
curl http://localhost:3000/api/health
```

### Переменные окружения

См. `.env.example` для полного списка переменных.

## 📊 Мониторинг

| Сервис | URL | Описание |
|--------|-----|----------|
| Grafana | http://localhost:3001 | Визуализация метрик |
| Prometheus | http://localhost:9090 | Сбор метрик |
| Node Exporter | http://localhost:9100 | Метрики сервера |

## 📚 Документация

- **[API Documentation](docs/API.md)** — полное API описание
- **[User Manual](docs/USER_MANUAL.md)** — руководство игрока
- **[Deployment Guide](docs/DEPLOYMENT.md)** — инструкция по деплою
- **[Architecture](ARCHITECTURE.md)** — архитектура проекта
- **[Sprint 5 Report](SPRINT_5_REPORT.md)** — отчёт о спринте

## 📝 Статус разработки

| Спринт | Период | Статус |
|--------|--------|--------|
| Спринт 1: Auth + Infrastructure | Недели 1-2 | ✅ Завершён |
| Спринт 2: Core Gameplay | Недели 3-4 | ✅ Завершён |
| Спринт 3: Progression | Недели 5-6 | ✅ Завершён |
| Спринт 4: Social & Monetization | Недели 7-8 | ✅ Завершён |
| **Спринт 5: Polish & Release** | **Недели 9-10** | **✅ Завершён** |

## 🎯 Готовность к релизу

- ✅ Bundle size < 500KB
- ✅ API Response time < 200ms
- ✅ Test coverage > 70%
- ✅ Rate limiting (100 req/min)
- ✅ Anti-cheat защита
- ✅ Бэкапы (daily, 7 дней)
- ✅ Мониторинг (Prometheus + Grafana)
- ✅ CI/CD (auto-deploy, rollback)
- ✅ Готовы к 10,000 пользователей

## 🔒 Безопасность

- Helmet security headers
- Rate limiting (100 req/min)
- Cooldown между действиями
- Валидация всех действий на сервере
- Логирование подозрительных активностей

## 📄 Лицензия

MIT
