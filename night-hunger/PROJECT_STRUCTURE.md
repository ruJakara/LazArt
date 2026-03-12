# Night Hunger: Vampire Evo - Project Structure

## 📁 Структура проекта

```
wisdom/
├── apps/                          # Приложения
│   ├── web/                       # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── components/        # UI компоненты
│   │   │   │   ├── common/        # Button, Card, ProgressBar
│   │   │   │   ├── game/          # HuntScreen, EnemyCard
│   │   │   │   └── layout/        # Header, Footer, Navigation
│   │   │   ├── screens/           # Основные экраны
│   │   │   │   ├── Hub/           # Главный хаб
│   │   │   │   ├── Hunt/          # Охота
│   │   │   │   ├── Upgrade/       # Прокачка
│   │   │   │   ├── Shop/          # Магазин
│   │   │   │   └── Leaderboard/   # Таблица лидеров
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── store/             # State management (Zustand)
│   │   │   ├── api/               # API client
│   │   │   ├── utils/             # Утилиты
│   │   │   ├── types/             # TypeScript типы
│   │   │   ├── styles/            # Глобальные стили
│   │   │   └── main.tsx           # Точка входа
│   │   ├── public/
│   │   │   ├── assets/            # Изображения, иконки
│   │   │   └── sounds/            # Звуковые эффекты
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── bot/                       # Telegram Bot (Python + Aiogram)
│       ├── src/
│       │   ├── handlers/          # Обработчики команд
│       │   ├── keyboards/         # Inline клавиатуры
│       │   └── notifications/     # Push-уведомления
│       └── package.json
│
├── services/                      # Backend сервисы
│   ├── api/                       # NestJS API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # Авторизация (Telegram)
│   │   │   │   ├── game/          # Игровая логика
│   │   │   │   ├── user/          # Пользователи
│   │   │   │   ├── upgrade/       # Прокачка характеристик
│   │   │   │   ├── inventory/     # Инвентарь и предметы
│   │   │   │   ├── leaderboard/   # Таблица лидеров
│   │   │   │   ├── payment/       # Платежи (Telegram Stars)
│   │   │   │   ├── referral/      # Реферальная система
│   │   │   │   └── notification/  # Уведомления
│   │   │   ├── common/
│   │   │   │   ├── decorators/    # Custom декораторы
│   │   │   │   ├── filters/       # Exception filters
│   │   │   │   ├── guards/        # Auth guards
│   │   │   │   ├── interceptors/  # Response interceptors
│   │   │   │   └── utils/         # Общие утилиты
│   │   │   ├── config/            # Конфигурация
│   │   │   ├── database/          # DB модели, миграции
│   │   │   └── main.ts            # Точка входа
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── worker/                    # Фоновые задачи (Bull + Redis)
│       ├── src/
│       │   ├── jobs/
│       │   │   ├── notification.job.ts
│       │   │   ├── leaderboard.job.ts
│       │   │   └── cleanup.job.ts
│       │   └── main.ts
│       └── package.json
│
├── packages/                      # Общие пакеты
│   ├── shared/                    # Общий код
│   │   ├── types/                 # TypeScript типы
│   │   ├── constants/             # Константы
│   │   └── utils/                 # Утилиты
│   │
│   └── game-core/                 # Игровая логика
│       ├── src/
│       │   ├── formulas/          # Формулы боя, опыта
│       │   ├── entities/          # Игровые сущности
│       │   └── rules/             # Правила игры
│
├── docker/                        # Docker конфигурации
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── api/Dockerfile
│   ├── web/Dockerfile
│   └── worker/Dockerfile
│
├── docs/                          # Документация
│   ├── API.md                     # API документация
│   ├── DATABASE.md                # Схема БД
│   └── DEPLOYMENT.md              # Инструкция по деплою
│
├── .env.example
├── .gitignore
├── package.json                   # Root package.json
├── README.md
└── ARCHITECTURE.md
```

## 🚀 Быстрый старт

1. **Установка зависимостей:**
   ```bash
   npm install
   ```

2. **Настройка окружения:**
   ```bash
   cp .env.example .env
   ```

3. **Запуск Docker (PostgreSQL + Redis):**
   ```bash
   npm run docker:up
   ```

4. **Запуск в режиме разработки:**
   ```bash
   npm run dev
   ```

## 📦 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск всех сервисов в режиме разработки |
| `npm run dev:api` | Запуск backend API |
| `npm run dev:web` | Запуск frontend |
| `npm run build` | Сборка всех сервисов |
| `npm run docker:up` | Запуск Docker контейнеров |
| `npm run docker:down` | Остановка Docker контейнеров |
