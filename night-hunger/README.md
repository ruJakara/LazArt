# Night Hunger: Vampire Evo

Проект находится в recovery-фазе (Stage 4 live core/economy/social, 10 марта 2026).

## Актуальный статус

- Рабочий baseline: Telegram bot + восстановленные экраны WebApp.
- Web frontend работает в split-режиме:
  - core API (`auth/user/game/upgrade/inventory/shop/leaderboard/referral`) -> live backend
  - extended API -> временный mock-контур для будущих модулей
- `services/api` собирается с включенными модулями:
  - `auth`, `user`, `game`, `upgrade`, `inventory`, `shop`, `leaderboard`, `referral`, `notification`
- Подтверждён локальный smoke для:
  - `auth -> hunt -> action -> state`
  - `upgrade -> inventory -> shop` (JWT smoke)
- `leaderboard -> referral` работает в live-контуре (API + UI smoke, включая клики по кнопкам).
- `notification + worker` queue-контур восстановлен (enqueue через API и обработка worker).
- Расширенный backend-модуль `payment` остаётся вне активного контура.
- Telegram delivery adapter в `worker` подключен; для фактической отправки нужен `TELEGRAM_BOT_TOKEN` в окружении `worker`.
  - Для локального docker-smoke используйте `docker-compose --env-file .env ...`, чтобы token гарантированно подхватился.
- Live smoke доставки в Telegram подтверждён 10.03.2026 (job завершён с `success=true`, получен `messageId`).
- Локальный аварийный запуск бота: `run-bot-only.bat`.
- Production запуск: `docker-compose -f docker/docker-compose.prod.yml up -d --build` (включает сервис `bot` с автоперезапуском).
  - Рекомендуется запускать с явным env-файлом: `docker-compose --env-file .env -f docker/docker-compose.prod.yml up -d --build`.
- Bot runtime hardening (24/7): heartbeat + watchdog внутри бота и Docker healthcheck (`src/healthcheck.py`).

Подробный статус и диагностические команды: `STATUS.md`.

## Быстрый локальный запуск (fallback)

1. Скопируй `.env.example` в `.env`.
2. Заполни минимум:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBAPP_URL`
3. Запусти:

```bat
run-bot-only.bat
```

4. В Telegram отправь `/start` и нажми `🎮 Играть`.

## Production (Always-On Bot)

```bash
chmod +x deploy-bot.sh
./deploy-bot.sh
docker-compose --env-file .env -f docker/docker-compose.prod.yml up -d --build
docker-compose --env-file .env -f docker/docker-compose.prod.yml ps
docker-compose --env-file .env -f docker/docker-compose.prod.yml logs -f bot
powershell -ExecutionPolicy Bypass -File .\bot-health.ps1
```

## Документация

- `STATUS.md` — что работает, что сломано, где логи.
- `BOT_ONLY.md` — минимальный запуск bot-only.
- `DEVELOPMENT_PLAN.md` — recovery-план по этапам.

## Архив

Устаревшие инструкции запуска перенесены в:

- `docs/archive/2026-03-stage0/HOW_TO_RUN.md`
- `docs/archive/2026-03-stage0/RUN_WITHOUT_TELEGRAM.md`
