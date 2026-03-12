# Night Hunger: Vampire Evo

Проект находится в recovery-фазе (Stage 4 live core/economy/social, 10 марта 2026).

## Актуальный статус

- Рабочий baseline: Telegram bot + восстановленные экраны WebApp.
- Web frontend работает в split-режиме:
  - core API (`auth/user/game/upgrade/inventory/shop/leaderboard/referral`) -> live backend
  - extended API -> временный mock-контур для будущих модулей
- `services/api` собирается с включенными модулями:
  - `auth`, `user`, `game`, `upgrade`, `inventory`, `shop`, `leaderboard`, `referral`, `notification`
- Локальный аварийный запуск бота: `run-bot-only.bat`.
- Production web больше не завязан на GitHub Pages:
  - frontend/API поднимаются на loopback-портах сервера (`127.0.0.1:8080` и `127.0.0.1:3000`)
  - внешний доступ должен идти через хостовый nginx reverse proxy (`deploy/nginx/night-hunger.conf.example`)
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

Для серверного front:

1. Возьми шаблон `deploy/nginx/night-hunger.conf.example`.
2. Замени `server_name` на свой домен.
3. Проксируй трафик на `127.0.0.1:8080`.
4. В `.env` укажи тот же HTTPS URL в `TELEGRAM_WEBAPP_URL`, `WEB_APP_URL` и `FRONTEND_URL`.

## Документация

- `STATUS.md` - что работает, что сломано, где логи.
- `BOT_ONLY.md` - минимальный запуск bot-only.
- `DEVELOPMENT_PLAN.md` - recovery-план по этапам.

## Архив

Устаревшие инструкции запуска перенесены в:

- `docs/archive/2026-03-stage0/HOW_TO_RUN.md`
- `docs/archive/2026-03-stage0/RUN_WITHOUT_TELEGRAM.md`