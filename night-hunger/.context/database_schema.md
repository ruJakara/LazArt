# Схема базы данных (PostgreSQL)

## Таблица: users
- `id` (bigint, PK): Telegram ID
- `username` (varchar): Никнейм
- `blood_balance` (int): Текущая валюта
- `xp` (int): Опыт
- `level` (int): Уровень
- `stats_strength` (int): Сила
- `stats_agility` (int): Ловкость
- `last_login` (timestamp)

## Таблица: inventory
- `id` (PK)
- `user_id` (FK -> users.id)
- `item_id` (varchar): ID предмета (skin_v1, potion_hp)
- `quantity` (int)

## Таблица: game_logs
- `id` (PK)
- `user_id` (FK)
- `action_type` (varchar): 'hunt', 'escape', 'feed'
- `result` (json): Детали исхода
- `created_at` (timestamp)