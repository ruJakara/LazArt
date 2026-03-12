# Database Schema

## Tables

### users
Основная таблица пользователей.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Telegram ID (Primary Key) |
| username | VARCHAR(255) | Имя пользователя |
| first_name | VARCHAR(255) | Имя |
| last_name | VARCHAR(255) | Фамилия |
| language_code | VARCHAR(10) | Язык (default: 'ru') |
| blood_balance | INTEGER | Баланс крови (default: 0) |
| xp | INTEGER | Опыт (default: 0) |
| level | INTEGER | Уровень (default: 1) |
| stats_strength | INTEGER | Сила (default: 1) |
| stats_agility | INTEGER | Ловкость (default: 1) |
| stats_hp | INTEGER | Макс. HP (default: 100) |
| current_hp | INTEGER | Текущие HP (default: 100) |
| skin_id | VARCHAR(50) | ID скина (default: 'default') |
| is_premium | BOOLEAN | Premium статус (default: false) |
| premium_expires_at | TIMESTAMP | Окончание premium |
| referral_code | VARCHAR(20) | Уникальный реф. код |
| referred_by | BIGINT | ID пригласившего (FK → users.id) |
| last_login | TIMESTAMP | Последний вход |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Indexes:**
- `idx_users_level` (level DESC)
- `idx_users_xp` (xp DESC)

---

### inventory
Инвентарь предметов.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| user_id | BIGINT | FK → users.id |
| item_id | VARCHAR(50) | ID предмета |
| item_type | VARCHAR(50) | Тип: 'skin', 'potion', 'boost' |
| quantity | INTEGER | Количество (default: 1) |
| created_at | TIMESTAMP | Дата получения |
| updated_at | TIMESTAMP | Дата обновления |

**Constraints:**
- UNIQUE(user_id, item_id)

**Indexes:**
- `idx_inventory_user` (user_id)

---

### hunt_logs
История охоты.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| user_id | BIGINT | FK → users.id |
| enemy_type | VARCHAR(50) | Тип врага |
| enemy_level | INTEGER | Уровень врага |
| action_taken | VARCHAR(50) | Действие: 'attack', 'escape', 'feed' |
| success | BOOLEAN | Успех действия |
| xp_gained | INTEGER | Полученный опыт |
| blood_gained | INTEGER | Полученная кровь |
| hp_lost | INTEGER | Потерянные HP |
| created_at | TIMESTAMP | Дата события |

**Indexes:**
- `idx_hunt_logs_user` (user_id, created_at)

---

### referrals
Рефералы.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| referrer_id | BIGINT | FK → users.id (пригласивший) |
| referred_id | BIGINT | FK → users.id (приглашённый) |
| bonus_claimed | BOOLEAN | Бонус получен |
| created_at | TIMESTAMP | Дата приглашения |

---

### payments
Платежи.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| user_id | BIGINT | FK → users.id |
| telegram_payment_id | VARCHAR(100) | ID платежа Telegram |
| amount | INTEGER | Сумма |
| currency | VARCHAR(10) | Валюта (default: 'XTR') |
| status | VARCHAR(20) | Статус: 'pending', 'completed', 'failed' |
| created_at | TIMESTAMP | Дата создания |

---

### leaderboard_cache
Кэш лидерборда.

| Column | Type | Description |
|--------|------|-------------|
| user_id | BIGINT | FK → users.id (Primary Key) |
| total_xp | INTEGER | Общий опыт |
| total_kills | INTEGER | Всего убийств |
| rank | INTEGER | Позиция в рейтинге |
| updated_at | TIMESTAMP | Дата обновления |

---

## ER Diagram

```
┌─────────────┐       ┌─────────────┐
│   users     │       │  inventory  │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id     │
│ username    │       │ item_id     │
│ ...         │       │ item_type   │
└─────────────┘       │ quantity    │
       │              └─────────────┘
       │
       │◄──────────────┐
       │               │
       ▼               │
┌─────────────┐  ┌─────────────┐
│  hunt_logs  │  │  referrals  │
├─────────────┤  ├─────────────┤
│ user_id     │  │ referrer_id │
│ enemy_type  │  │ referred_id │
│ ...         │  │ ...         │
└─────────────┘  └─────────────┘
       │
       │
       ▼
┌─────────────┐
│  payments   │
├─────────────┤
│ user_id     │
│ amount      │
│ ...         │
└─────────────┘
```

---

## Миграции

Миграции хранятся в `services/api/src/database/migrations/`.

### Создание миграции (TypeORM)
```bash
npm run typeorm -- migration:create src/database/migrations/CreateUsersTable
```

### Применение миграций
```bash
npm run typeorm -- migration:run
```

### Откат миграций
```bash
npm run typeorm -- migration:revert
```

---

## Seeds

Начальные данные хранятся в `services/api/src/database/seeds/`.

### Запуск сидов
```bash
npm run seed
```
