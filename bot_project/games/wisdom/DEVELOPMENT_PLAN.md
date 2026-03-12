# 📋 План разработки: Night Hunger: Vampire Evo

**Дата начала:** 9 марта 2026 г.  
**Методология:** Спринты по 2 недели  
**Всего спринтов:** 5 (10 недель)

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
- [ ] **Leaderboard Module**
  - [ ] GET /api/leaderboard — топ 100 игроков
  - [ ] GET /api/leaderboard/me — позиция игрока
  - [ ] Кэширование в Redis (обновление каждые 5 мин)
- [ ] **Referral Module**
  - [ ] GET /api/referral/code — получить код
  - [ ] GET /api/referral/bonus — забрать бонус
  - [ ] Бонус за реферала: 100 крови
- [ ] **Payment Module**
  - [ ] POST /api/payment/create — создание платежа
  - [ ] POST /api/payment/webhook — обработка от Telegram
  - [ ] Интеграция Telegram Stars
- [ ] **Notification Module**
  - [ ] Push-уведомления через бота
  - [ ] Планировщик (Bull Queue)
  - [ ] Напоминания об охоте

#### Frontend (React)
- [ ] **Leaderboard Screen**
  - [ ] Таблица лидеров (ранг, игрок, XP)
  - [ ] Подсветка текущей позиции
  - [ ] Фильтры (по XP, по убийствам)
- [ ] **Referral UI**
  - [ ] Отображение реф. кода
  - [ ] Кнопка «Пригласить» (share в Telegram)
  - [ ] Список приглашённых
  - [ ] Кнопка «Забрать бонус»
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
