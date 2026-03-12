# QUICKSTART

Актуальный quickstart для текущего состояния проекта:

Production запуск (always-on бот через Docker):

1. Убедиться, что в `.env` заданы:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBAPP_URL`
2. Запустить:
   - `chmod +x deploy-bot.sh`
   - `./deploy-bot.sh`
3. Проверить бот:
   - `docker-compose --env-file .env -f docker/docker-compose.prod.yml logs -f bot`
   - `powershell -ExecutionPolicy Bypass -File .\bot-health.ps1`

Локальный fallback запуск:

1. Скопировать `.env.example` в `.env`.
2. Заполнить `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBAPP_URL`.
3. Запустить `run-bot-only.bat`.
4. В Telegram открыть бота, выполнить `/start`, нажать `🎮 Играть`.

Детали и диагностика: `STATUS.md`.

Для фронтенд-разработки:

1. Stage 1 (полный mock):
   - `VITE_USE_MOCK_API=true`
2. Stage 3 (интеграция MVP):
   - `VITE_USE_MOCK_API=false`
   - `VITE_USE_MOCK_CORE_API=false`
   - `VITE_USE_MOCK_EXTENDED_API=true` (опционально, для будущих расширенных модулей)
   - В этом режиме live: `auth/user/game/upgrade/inventory/shop/leaderboard/referral`
3. Запустить `npm run dev --prefix apps/web`.

Для backend MVP (Stage 2):

1. Проверить сборку: `npm run build --prefix services/api`.
2. Активные модули в текущем контуре: `auth`, `user`, `game`, `upgrade`, `inventory`, `shop`, `leaderboard`, `referral`, `notification`.
3. Базовый цикл (`auth -> hunt -> action -> state`) подтверждён локально на 2026-03-09.
4. Очереди и worker:
   - `docker-compose --env-file .env -f docker/docker-compose.no-bot.yml up -d --build`
   - в окружении worker должен быть `TELEGRAM_BOT_TOKEN` для реальной отправки в Telegram
   - проверить `POST /api/notification/send` и `POST /api/notification/reminder`
   - логи: `docker-compose --env-file .env -f docker/docker-compose.no-bot.yml logs -f worker`
