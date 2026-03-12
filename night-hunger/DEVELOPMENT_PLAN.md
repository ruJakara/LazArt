# 📋 План разработки: Night Hunger: Vampire Evo

**Дата начала:** 9 марта 2026 г.  
**Методология:** Спринты по 2 недели  
**Всего спринтов:** 5 (10 недель)

---

## ⚠️ Актуализация плана (после аудита кода, март 2026)

Текущий документ ниже описывает целевое состояние, но фактическое состояние проекта отличается:

- WebApp и бот запускаются в рабочем recovery-контуре (экраны восстановлены).
- `services/api` собирается и работает с активными модулями `auth/user/game/upgrade/inventory/shop/leaderboard/referral/notification`.
- `apps/web` подключён к live API для core-геймплея + экономики + social (`leaderboard/referral`).

Ниже добавлен **реалистичный recovery-план**. Работать рекомендуется по нему.

---

## ✅ Recovery Plan (актуальный)

### Этап 0 — Freeze и базовая стабилизация (1-2 дня)
**Цель:** зафиксировать рабочую точку, чтобы не терять прогресс.

- [x] Зафиксировать текущий bot-only + WebApp baseline.
- [x] Привести `.env.example` к текущему сценарию запуска.
- [x] Добавить единый `STATUS.md` (что работает / что сломано / где логи).
- [x] Очистить/архивировать устаревшие инструкции запуска (`HOW_TO_RUN`, `RUN_WITHOUT_TELEGRAM`).

**Готово, если:**
- Бот стабильно отвечает на `/start`.
- Кнопка `🎮 Играть` открывает рабочий URL.
- Команда разработчика понимает единственный актуальный путь запуска.

---

### Этап 1 — Возврат полноценного frontend (2-4 дня)
**Цель:** вернуть экраны игры вместо временной заглушки.

- [x] Восстановить роутинг и экраны `Hub/Hunt/Upgrade/Inventory/Shop/Leaderboard/Referral`.
- [x] Починить критичные ошибки импорта/типов в `apps/web`.
- [x] Временно замокать backend-ответы для экранов, где API ещё не готов.
- [x] Сохранить успешную сборку для GitHub Pages.

**Готово, если:**
- `npm run build --prefix apps/web` проходит.
- На Pages открывается не заглушка, а базовый игровой интерфейс.

---

### Этап 2 — Минимально рабочий backend MVP (4-7 дней)
**Цель:** поднять API для основного игрового цикла.

- [x] Починить сборку `services/api` (типы, импорты, DTO, зависимости).
- [x] Привести `User.id`/FK к единому типу (number vs string vs bigint).
- [x] Запустить минимальный набор модулей:
  - [x] `auth`
  - [x] `user`
  - [x] `game` (hunt + action + state + respawn)
- [x] Отключить/фичефлагом убрать второстепенные модули до стабилизации (`payment`, часть `notification`, часть `referral`).

**Готово, если:**
- `npm run build --prefix services/api` проходит.
- Работает цикл: авторизация → старт охоты → действие → обновление состояния.

---

### Этап 3 — Интеграция frontend + backend (3-5 дней)
**Цель:** убрать моки и подключить реальные API.

- [x] Подключить фронт к живым endpoint-ам MVP (core `auth/user/game`; на Stage 4 добавлены live `upgrade/inventory/shop/leaderboard/referral`).
- [x] Проверить состояние пользователя, бой, награды, воскрешение (подтверждено вручную в Telegram WebApp, 2026-03-10).
- [x] Подправить UX и обработку ошибок (401, сеть, timeouts).
- [x] Добавить smoke-проверки для ключевых сценариев (Playwright smoke + `render_game_to_text`, 2026-03-10).

**Готово, если:**
- Игрок проходит базовую сессию боя из Telegram WebApp end-to-end.

---

### Этап 4 — Социальные и экономические фичи (по готовности)
**Цель:** подключить расширенные модули после ядра.

- [x] `upgrade` + `inventory` + `shop` (live в backend/frontend, 2026-03-10).
- [x] Перевести Telegram-бот в always-on инфраструктурный запуск (Docker Compose `prod`, сервис `bot`, автоперезапуск).
- [x] `leaderboard` (live backend/frontend, 2026-03-10).
- [x] `referral` (live backend/frontend, без ломки типов, 2026-03-10).
- [x] `notification` + `worker` (queue-контур восстановлен, 2026-03-10).
- [ ] `leaderboard` кэш (Redis) вернуть после стабилизации.
- [ ] `payment` (убрать mock и сделать реальную интеграцию).
- [x] Финальная проверка live-доставки уведомлений из worker в Telegram (валидный token + реальный chat smoke, 2026-03-10).

**Готово, если:**
- Все модули включаются без регрессии core-геймплея.

---

## 📌 Приоритеты (жёстко по порядку)

1. Рабочий frontend + bot UX.
2. Сборка и запуск backend ядра.
3. End-to-end охота.
4. Только потом: платежи, рефералка, фоновые задачи, оптимизации.

---

## 🧪 Definition of Done для каждой задачи

- [ ] Есть локальный способ воспроизведения.
- [ ] Есть проверка (команда/тест/скрин/логи).
- [ ] Нет регрессии bot-only запуска.
- [ ] Документация обновлена в том же PR.

---

## 🎯 Спринт 1: Auth + Базовая инфраструктура
**Период:** Недели 1-2  
**Статус:** ⏳ Pending

### Задачи

#### Backend (NestJS)
- [ ] **Auth Module** — завершить валидацию Telegram initData
  - [ ] Сохранение пользователя в БД при первом входе
  - [ ] Генерация реферального кода
  - [ ] Refresh токенов
- [ ] **Database** — настроить TypeORM + миграции
  - [ ] Entity: User
  - [ ] Entity: Inventory
  - [ ] Entity: GameLog
  - [ ] Seed данные для тестирования
- [ ] **User Module** — CRUD операции
  - [ ] GET /api/user/profile
  - [ ] GET /api/user/stats
- [ ] **Config** — вынести все константы в config-модуль

#### Frontend (React)
- [ ] **Store** — настроить Zustand store
  - [ ] userStore (аутентификация, профиль)
  - [ ] gameStore (состояние игры)
- [ ] **API Client** — axios instance с интерцепторами
  - [ ] Авто-добавление Authorization заголовка
  - [ ] Обработка 401 (refresh token)
- [ ] **Telegram SDK** — интеграция
  - [ ] Инициализация WebApp
  - [ ] Получение initData
  - [ ] tg.expand()
- [ ] **Hub Screen** — главный экран
  - [ ] Отображение профиля (уровень, кровь)
  - [ ] Навигация по экранам

#### Инфраструктура
- [ ] Docker Compose для разработки
- [ ] CI/CD пайплайн (GitHub Actions)
- [ ] Pre-commit хуки (lint, format)

### Критерии готовности
- ✅ Пользователь может войти через Telegram
- ✅ Данные пользователя сохраняются в БД
- ✅ Frontend получает и отображает профиль
- ✅ Работает refresh токена

---

## 🎯 Спринт 2: Core Gameplay — Охота и бой
**Период:** Недели 3-4  
**Статус:** ⏳ Pending

### Задачи

#### Backend (NestJS)
- [ ] **Game Module** — основная логика
  - [ ] POST /api/game/hunt — начало охоты
  - [ ] POST /api/game/action — действие (attack/escape/feed)
  - [ ] POST /api/game/state — состояние игры
- [ ] **Combat System** — формулы из game-core
  - [ ] calculateDamage (Strength * 1.5 - Armor)
  - [ ] calculateEscapeChance (Agility / EnemyAgility)
  - [ ] calculateFeedAmount
- [ ] **Enemy System** — генерация врагов
  - [ ] 5 типов врагов (wolf, hunter, witch, demon, angel)
  - [ ] Scaling от уровня игрока
- [ ] **Game Logs** — запись истории
  - [ ] Логирование каждой охоты
  - [ ] Статистика побед/поражений

#### Frontend (React)
- [ ] **Hunt Screen** — экран охоты
  - [ ] Отображение врага (спрайт, HP bar)
  - [ ] Кнопки действий: ⚔️ Атака, 🏃 Побег, 🩸 Поглощение
  - [ ] Анимации атаки (Framer Motion)
  - [ ] Лог боя (текстовые события)
- [ ] **Combat UI**
  - [ ] ProgressBar HP (зелёный)
  - [ ] ProgressBar XP (синий)
  - [ ] Индикатор урона (всплывающие цифры)
- [ ] **Game Hooks**
  - [ ] useHunt — логика охоты
  - [ ] useCombat — боевые действия
  - [ ] useEnemy — управление врагом

#### Game Core (packages/game-core)
- [ ] **Formulas** — реализовать все формулы
- [ ] **Entities** — Player, Enemy классы
- [ ] **Rules** — performAttack, performEscape, performFeed

### Критерии готовности
- ✅ Игрок может начать охоту
- ✅ Работают все боевые действия (атака, побег, поглощение)
- ✅ Враги генерируются с правильными характеристиками
- ✅ HP/XP обновляются после боя
- ✅ История боёв сохраняется

---

## 🎯 Спринт 3: Прокачка и Инвентарь
**Период:** Недели 5-6  
**Статус:** ⏳ Pending

### Задачи

#### Backend (NestJS)
- [ ] **Upgrade Module**
  - [ ] GET /api/upgrade/options — доступные улучшения
  - [ ] POST /api/upgrade/buy — покупка улучшения
  - [ ] Формула стоимости: `100 * Level`
- [ ] **Inventory Module**
  - [ ] GET /api/inventory — список предметов
  - [ ] POST /api/inventory/use — использование предмета
  - [ ] POST /api/inventory/sell — продажа предмета
- [ ] **Shop Module** (новый)
  - [ ] GET /api/shop/items — товары магазина
  - [ ] POST /api/shop/buy — покупка за кровь
- [ ] **Level System**
  - [ ] XP формула: `100 * (Level ^ 1.5)`
  - [ ] Auto-level up при достижении порога
  - [ ] Начисление stat points за уровень

#### Frontend (React)
- [ ] **Upgrade Screen**
  - [ ] Карточки характеристик (Сила, Ловкость, HP)
  - [ ] Отображение текущих значений
  - [ ] Кнопки покупки с стоимостью
  - [ ] Предпросмотр улучшений (+статы)
- [ ] **Inventory Screen**
  - [ ] Сетка предметов
  - [ ] Количественный счётчик
  - [ ] Контекстное меню (использовать/продать)
- [ ] **Shop Screen**
  - [ ] Витрина товаров
  - [ ] Фильтры по категориям
  - [ ] Покупка в 1 клик
- [ ] **Item Components**
  - [ ] Potion — восстановление HP
  - [ ] Skin — смена внешнего вида
  - [ ] Boost — временные баффы

#### Database
- [ ] Миграция: Таблица `items` (справочник предметов)
- [ ] Миграция: Таблица `shops` (товары магазина)

### Критерии готовности
- ✅ Игрок может прокачивать характеристики
- ✅ Работает магазин предметов
- ✅ Инвентарь отображает все предметы
- ✅ Предметы можно использовать/продавать

---

## 🎯 Спринт 4: Социал и Монетизация
**Период:** Недели 7-8  
**Статус:** ⏳ Pending

### Задачи

#### Backend (NestJS)
- [x] **Leaderboard Module** (без Redis-кэша на текущем этапе)
  - [x] GET /api/leaderboard — топ игроков
  - [x] GET /api/leaderboard/me — позиция игрока
  - [ ] Кэширование в Redis (обновление каждые 5 мин)
- [x] **Referral Module**
  - [x] GET /api/referral/code — получить код
  - [x] POST /api/referral/bonus — забрать бонус
  - [x] Бонус за реферала: 100 крови
- [ ] **Payment Module**
  - [ ] POST /api/payment/create — создание платежа
  - [ ] POST /api/payment/webhook — обработка от Telegram
  - [ ] Интеграция Telegram Stars
- [ ] **Notification Module** (частично завершён)
  - [x] Push-уведомления через бота (delivery adapter + live smoke 2026-03-10)
  - [x] Планировщик/очереди (Bull Queue)
  - [x] Напоминания об охоте (queue job)

#### Frontend (React)
- [x] **Leaderboard Screen**
  - [x] Таблица лидеров (ранг, игрок, XP)
  - [x] Подсветка текущей позиции
  - [x] Фильтры (по XP, по убийствам)
- [x] **Referral UI** (MVP-вариант)
  - [x] Отображение реф. кода
  - [x] Кнопка «Пригласить» (share в Telegram / fallback)
  - [ ] Список приглашённых (детальный список по пользователям)
  - [x] Кнопка «Забрать бонус»
- [ ] **Shop Premium**
  - [ ] Покупка за Telegram Stars
  - [ ] Premium скины
  - [ ] История покупок

#### Telegram Bot
- [ ] Команды: /profile, /hunt, /leaderboard
- [ ] Inline-кнопки для быстрого доступа
- [ ] Push-уведомления о событиях

### Критерии готовности
- ✅ Таблица лидеров обновляется в реальном времени
- ✅ Реферальная система работает
- ✅ Можно купить Telegram Stars
- ✅ Бот отправляет уведомления

---

## 🎯 Спринт 5: Полировка и Релиз
**Период:** Недели 9-10  
**Статус:** ⏳ Pending

### Задачи

#### Оптимизация
- [ ] **Frontend Performance**
  - [ ] Code splitting (React.lazy)
  - [ ] Lazy loading изображений
  - [ ] Мемоизация компонентов (React.memo)
  - [ ] Bundle size < 500KB
- [ ] **Backend Performance**
  - [ ] Database индексы на всех FK
  - [ ] Redis кэш для частых запросов
  - [ ] Rate limiting (100 req/min)
- [ ] **Bundle Size**
  - [ ] Tree shaking
  - [ ] Minification

#### Тестирование
- [ ] **Unit Tests** (Jest)
  - [ ] Тесты формул (game-core)
  - [ ] Тесты сервисов
  - [ ] Покрытие > 70%
- [ ] **E2E Tests**
  - [ ] Критические пути (auth → hunt → upgrade)
  - [ ] API тесты (Supertest)
- [ ] **Load Testing**
  - [ ] 1000 одновременных пользователей
  - [ ] Response time < 200ms

#### Безопасность
- [ ] **Anti-Cheat**
  - [ ] Валидация всех действий на сервере
  - [ ] Cooldown между охотой (5 сек)
  - [ ] Логирование подозрительных активностей
- [ ] **Security Audit**
  - [ ] Проверка уязвимостей (npm audit)
  - [ ] HTTPS в production
  - [ ] Secure headers (Helmet)

#### Деплой
- [ ] **Production Environment**
  - [ ] Docker Compose (prod)
  - [ ] Domain + SSL (Let's Encrypt)
  - [ ] Monitoring (Prometheus + Grafana)
- [ ] **CI/CD**
  - [ ] Auto-deploy на main branch
  - [ ] Rollback при ошибках
- [ ] **Backup**
  - [ ] Daily DB backups
  - [ ] Backup retention 7 дней

#### Документация
- [ ] API документация (Swagger/OpenAPI)
- [ ] User manual для игроков
- [ ] Admin panel для модерации

### Критерии готовности
- ✅ Все тесты проходят
- ✅ Production развёрнут
- ✅ Мониторинг настроен
- ✅ Готовы к загрузке 10,000 пользователей

---

## 📊 Диаграмма Ганта

```
Спринт | Неделя 1 | Неделя 2 | Неделя 3 | Неделя 4 | Неделя 5 | Неделя 6 | Неделя 7 | Неделя 8 | Неделя 9 | Неделя 10
─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────
  1      │ ████████ │ ████████ │          │          │          │          │          │          │          │
  2      │          │          │ ████████ │ ████████ │          │          │          │          │          │
  3      │          │          │          │          │ ████████ │ ████████ │          │          │          │
  4      │          │          │          │          │          │          │ ████████ │ ████████ │          │
  5      │          │          │          │          │          │          │          │          │ ████████ │ ████████
```

---

## 🎯 MVP (Минимальный жизнеспособный продукт)

**Цель:** Конец Спринта 3 (Неделя 6)

### Функции MVP
- ✅ Вход через Telegram
- ✅ Охота на врагов (attack/escape)
- ✅ Прокачка характеристик
- ✅ Базовый инвентарь
- ✅ Таблица лидеров (без кэша)

### Без MVP (отложено)
- ❌ Telegram Stars
- ❌ Реферальная система
- ❌ Push-уведомления
- ❌ Premium скины

---

## 📈 Метрики успеха

| Метрика | Цель | Измерение |
|---------|------|-----------|
| DAU (Daily Active Users) | 1,000+ | Analytics |
| Retention Day 1 | 40%+ | Cohort analysis |
| Retention Day 7 | 15%+ | Cohort analysis |
| Average Session | 5+ min | Analytics |
| Conversion to Payment | 3%+ | Payment logs |
| API Response Time | < 200ms | Monitoring |
| Error Rate | < 0.1% | Error tracking |

---

## 🛠 Инструменты разработки

| Категория | Инструмент |
|-----------|------------|
| Version Control | Git + GitHub |
| Project Management | GitHub Projects / Notion |
| Communication | Telegram / Discord |
| Code Editor | VS Code |
| Database GUI | DBeaver / pgAdmin |
| API Testing | Postman / Insomnia |
| Monitoring | Prometheus + Grafana |
| Error Tracking | Sentry |
| Analytics | Telegram Analytics / Custom |

---

## 📝 Ежедневные ритуалы

- **Daily Standup** (15 мин) — что сделал, что буду делать, проблемы
- **Code Review** — перед каждым merge в main
- **Demo Day** (конец спринта) — демонстрация функционала

---

## ⚠️ Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Задержки API Telegram | Средняя | Высокое | Кэширование, retry logic |
| Баланс игры нарушен | Высокое | Среднее | Быстрые хотфиксы формул |
| Нагрузка на БД | Средняя | Высокое | Redis кэш, индексы |
| Блокировка Telegram | Низкое | Критичное | Backup домен, зеркала |
