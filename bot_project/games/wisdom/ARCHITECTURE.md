# Архитектура проекта: Night Hunger: Vampire Evo

## 1. Общая схема архитектуры

```
┌─────────────────────────────────────────────────────────────────┐
│                        Telegram Client                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Telegram Mini App (WebApp)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │   React     │  │   Tailwind  │  │  Telegram SDK   │  │    │
│  │  │   (Vite)    │  │    CSS      │  │  (@twa-dev)     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Server (NestJS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   REST API   │  │  WebSocket   │  │   Telegram Bot API   │  │
│  │  Controllers │  │   Gateway    │  │   (Notifications)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Auth      │  │    Game      │  │   Payment Service    │  │
│  │    Module    │  │    Module    │  │   (Telegram Stars)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Leader     │  │    User      │  │   Anti-Cheat         │  │
│  │   Module     │  │   Module     │  │   Guards             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ PostgreSQL  │  │   Redis     │  │   File      │
     │   (Main DB) │  │  (Cache)    │  │   Storage   │
     └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 2. Структура проекта (Monorepo)

```
night-hunger/
├── apps/
│   ├── web/                      # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── components/       # UI компоненты
│   │   │   │   ├── common/       # Button, Card, ProgressBar
│   │   │   │   ├── game/         # HuntScreen, EnemyCard
│   │   │   │   └── layout/       # Header, Footer, Navigation
│   │   │   ├── screens/          # Основные экраны
│   │   │   │   ├── Hub/
│   │   │   │   ├── Hunt/
│   │   │   │   ├── Upgrade/
│   │   │   │   ├── Shop/
│   │   │   │   └── Leaderboard/
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── store/            # State management (Zustand/Redux)
│   │   │   ├── api/              # API client
│   │   │   ├── utils/            # Утилиты
│   │   │   ├── types/            # TypeScript типы
│   │   │   ├── styles/           # Глобальные стили
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   ├── assets/           # Изображения, иконки
│   │   │   └── sounds/           # Звуковые эффекты
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── bot/                      # Telegram Bot (Python + Aiogram)
│       ├── src/
│       │   ├── handlers/         # Обработчики команд
│       │   ├── keyboards/        # Inline клавиатуры
│       │   ├── notifications/    # Push-уведомления
│       │   └── main.py
│       └── package.json
│
├── services/
│   ├── api/                      # Backend (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Авторизация через Telegram
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── game/         # Игровая логика
│   │   │   │   │   ├── game.controller.ts
│   │   │   │   │   ├── game.service.ts
│   │   │   │   │   ├── hunt.service.ts
│   │   │   │   │   ├── combat.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── user/         # Пользователи
│   │   │   │   │   ├── user.controller.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── upgrade/      # Прокачка характеристик
│   │   │   │   │   ├── upgrade.controller.ts
│   │   │   │   │   ├── upgrade.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── inventory/    # Инвентарь и предметы
│   │   │   │   │   ├── inventory.controller.ts
│   │   │   │   │   ├── inventory.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── leaderboard/  # Таблица лидеров
│   │   │   │   │   ├── leaderboard.controller.ts
│   │   │   │   │   ├── leaderboard.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── payment/      # Платежи (Telegram Stars)
│   │   │   │   │   ├── payment.controller.ts
│   │   │   │   │   ├── payment.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── referral/     # Реферальная система
│   │   │   │   │   ├── referral.controller.ts
│   │   │   │   │   ├── referral.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── notification/ # Уведомления
│   │   │   │       ├── notification.service.ts
│   │   │   │       └── notification.scheduler.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/   # Custom декораторы
│   │   │   │   ├── filters/      # Exception filters
│   │   │   │   ├── guards/       # Auth guards
│   │   │   │   ├── interceptors/ # Response interceptors
│   │   │   │   └── utils/        # Общие утилиты
│   │   │   ├── config/           # Конфигурация
│   │   │   ├── database/         # DB модели, миграции
│   │   │   │   ├── entities/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── worker/                   # Фоновые задачи (Bull + Redis)
│       ├── src/
│       │   ├── jobs/
│       │   │   ├── notification.job.ts
│       │   │   ├── leaderboard.job.ts
│       │   │   └── cleanup.job.ts
│       │   └── main.ts
│       └── package.json
│
├── packages/                     # Общие пакеты
│   ├── shared/                   # Общий код (types, utils)
│   │   ├── types/                # Общие TypeScript типы
│   │   ├── constants/            # Константы
│   │   ├── utils/                # Утилиты
│   │   └── package.json
│   │
│   └── game-core/                # Игровая логика (shared)
│       ├── src/
│       │   ├── formulas/         # Формулы боя, опыта
│       │   ├── entities/         # Игровые сущности
│       │   └── rules/            # Правила игры
│       └── package.json
│
├── docker/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── api/
│   │   └── Dockerfile
│   ├── web/
│   │   └── Dockerfile
│   └── worker/
│       └── Dockerfile
│
├── docs/
│   ├── API.md                    # API документация
│   ├── DATABASE.md               # Схема БД
│   └── DEPLOYMENT.md             # Инструкция по деплою
│
├── .env.example
├── .gitignore
├── README.md
└── package.json                  # Root package.json (workspaces)
```

---

## 3. Технологический стек

### Frontend (`apps/web`)
| Технология | Версия | Назначение |
|---|---|---|
| React | 18+ | UI фреймворк |
| TypeScript | 5+ | Типизация |
| Vite | 5+ | Сборщик |
| Tailwind CSS | 3+ | Стилизация |
| @twa-dev/sdk | latest | Telegram WebApp SDK |
| Zustand | 4+ | State management |
| React Router | 6+ | Роутинг |
| Framer Motion | 10+ | Анимации |
| Axios | 1+ | HTTP клиент |
| ESLint + Prettier | — | Линтинг |

### Backend (`services/api`)
| Технология | Версия | Назначение |
|---|---|---|
| NestJS | 10+ | Backend фреймворк |
| TypeScript | 5+ | Типизация |
| PostgreSQL | 15+ | Основная БД |
| TypeORM / Prisma | — | ORM |
| Redis | 7+ | Кэш, сессии |
| Bull | 4+ | Очереди задач |
| JWT | — | Токены авторизации |
| class-validator | — | Валидация DTO |
| Jest | 29+ | Тестирование |

### Telegram Bot (`apps/bot`)
| Технология | Версия | Назначение |
|---|---|---|
| Python | 3.11+ | Язык |
| Aiogram | 3+ | Bot фреймворк |
| Aiohttp | — | HTTP клиент |
| Redis | 7+ | Кэш |

---

## 4. Схема базы данных

```sql
-- Пользователи
CREATE TABLE users (
    id BIGINT PRIMARY KEY,              -- Telegram ID
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    blood_balance INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    stats_strength INTEGER DEFAULT 1,
    stats_agility INTEGER DEFAULT 1,
    stats_hp INTEGER DEFAULT 100,
    current_hp INTEGER DEFAULT 100,
    skin_id VARCHAR(50) DEFAULT 'default',
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    referral_code VARCHAR(20) UNIQUE,
    referred_by BIGINT REFERENCES users(id),
    last_login TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Инвентарь
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    item_type VARCHAR(50) NOT NULL,      -- 'skin', 'potion', 'boost'
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- История охоты
CREATE TABLE hunt_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    enemy_type VARCHAR(50) NOT NULL,
    enemy_level INTEGER NOT NULL,
    action_taken VARCHAR(50) NOT NULL,   -- 'attack', 'escape', 'feed'
    success BOOLEAN NOT NULL,
    xp_gained INTEGER DEFAULT 0,
    blood_gained INTEGER DEFAULT 0,
    hp_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Рефералы
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES users(id),
    referred_id BIGINT REFERENCES users(id),
    bonus_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Платежи
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    telegram_payment_id VARCHAR(100),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'XTR',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Лидерборд (кэшированный)
CREATE TABLE leaderboard_cache (
    user_id BIGINT PRIMARY KEY,
    total_xp INTEGER NOT NULL,
    total_kills INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_hunt_logs_user ON hunt_logs(user_id, created_at);
CREATE INDEX idx_inventory_user ON inventory(user_id);
```

---

## 5. API Endpoints

### Auth
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/api/auth/validate` | Валидация Telegram initData |
| POST | `/api/auth/refresh` | Обновление токена |
| GET | `/api/auth/me` | Получение данных пользователя |

### Game
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/game/hunt` | Начало охоты (случайная встреча) |
| POST | `/api/game/action` | Действие (attack/escape/feed) |
| GET | `/api/game/state` | Текущее состояние игры |
| POST | `/api/game/respawn` | Воскрешение после смерти |

### User
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/user/profile` | Профиль пользователя |
| GET | `/api/user/stats` | Статистика |
| PUT | `/api/user/skin` | Смена скина |

### Upgrade
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/upgrade/options` | Доступные улучшения |
| POST | `/api/upgrade/buy` | Покупка улучшения |

### Inventory
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/inventory` | Список предметов |
| POST | `/api/inventory/use` | Использование предмета |

### Leaderboard
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/leaderboard` | Топ игроков |
| GET | `/api/leaderboard/me` | Позиция игрока |

### Payment
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/api/payment/create` | Создание платежа |
| POST | `/api/payment/webhook` | Webhook от Telegram |

### Referral
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/referral/code` | Получить реферальный код |
| GET | `/api/referral/bonus` | Забрать бонус |

---

## 6. Игровая логика (Core Formulas)

### Урон
```typescript
function calculateDamage(strength: number, enemyArmor: number): number {
  const damage = strength * 1.5 - enemyArmor;
  return Math.max(1, Math.floor(damage));
}
```

### Шанс побега
```typescript
function calculateEscapeChance(agility: number, enemyAgility: number): number {
  const chance = (agility / enemyAgility) * 100;
  return Math.min(90, Math.max(10, Math.floor(chance)));
}
```

### Опыт для уровня
```typescript
function getXpForLevel(level: number): number {
  const BASE_XP = 100;
  return Math.floor(BASE_XP * Math.pow(level, 1.5));
}
```

### Стоимость прокачки
```typescript
function getUpgradeCost(currentLevel: number, stat: string): number {
  const BASE_COST = 100;
  return BASE_COST * currentLevel;
}
```

---

## 7. Безопасность

### Валидация Telegram initData
```typescript
// Backend проверка подлинности данных от Telegram
function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  return computedHash === hash;
}
```

### Anti-Cheat меры
- Вся логика начисления валюты на сервере
- Rate limiting на endpoints
- Валидация действий (cooldown между охотой)
- Логирование подозрительных активностей
- Проверка целостности состояния

---

## 8. Деплой

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  api:
    build: ./services/api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  web:
    build: ./apps/web
    ports:
      - "80:80"

  worker:
    build: ./services/worker
    depends_on:
      - redis

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

---

## 9. План разработки (спринты)

### Спринт 1: Foundation (Неделя 1-2)
- [ ] Настройка монорепозитория
- [ ] Базовая структура NestJS + React
- [ ] Интеграция Telegram WebApp SDK
- [ ] Auth модуль (валидация initData)
- [ ] Базовая схема БД

### Спринт 2: Core Gameplay (Неделя 3-4)
- [ ] Hunt механика (случайные встречи)
- [ ] Combat система (attack/escape)
- [ ] Прокачка характеристик
- [ ] UI главных экранов

### Спринт 3: Progression (Неделя 5-6)
- [ ] Система уровней и опыта
- [ ] Инвентарь и предметы
- [ ] Магазин скинов
- [ ] Визуальные эффекты

### Спринт 4: Social & Monetization (Неделя 7-8)
- [ ] Лидерборды
- [ ] Реферальная система
- [ ] Telegram Stars интеграция
- [ ] Push-уведомления

### Спринт 5: Polish & Release (Неделя 9-10)
- [ ] Оптимизация производительности
- [ ] Тестирование и багфикс
- [ ] Подготовка к релизу
- [ ] Деплой и мониторинг
