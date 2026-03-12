# STATUS

Обновлено: 2026-03-12

## Текущее состояние (Stage 4: economy + social live + queue contour, без payment)

- Рабочая конфигурация: Docker production stack с always-on ботом + Stage 4 (core/economy/social в live) + queue contour.
- Backend `services/api` собирается в recovery-контуре (core + economy + social + notification API).
- Локальный fallback для бота: `run-bot-only.bat`.

## Что работает

- Бот содержит обработчик `/start` и кнопку `🎮 Играть`:
  - `apps/bot/src/handlers/commands.py`
  - `apps/bot/src/keyboards/keyboards.py`
- WebApp открывается только при валидном `TELEGRAM_WEBAPP_URL` (`http/https`, не placeholder-домен).
- `apps/web` собирается:
  - `npm run build --prefix apps/web` -> OK (проверено 2026-03-10).
- Восстановлен роутинг экранов:
  - `Hub/Hunt/Upgrade/Inventory/Shop/Leaderboard/Referral`.
- Фронтенд переведён на split-режим API:
  - core (`auth/user/game/upgrade/inventory/shop/leaderboard/referral`) -> live backend (`VITE_USE_MOCK_CORE_API=false`)
  - extended (временный контур для будущих модулей) -> mock при необходимости
- `services/api` собирается:
  - `npm run build --prefix services/api` -> OK (проверено 2026-03-10).
- В backend активный recovery-контур модулей:
  - `auth`
  - `user`
  - `game`
  - `upgrade`
  - `inventory`
  - `shop`
  - `leaderboard`
  - `referral`
  - `notification`
- Проверен базовый runtime-цикл backend MVP:
  - `auth -> game/hunt -> game/action -> game/state` -> OK (проверено 2026-03-09, локальный smoke).
- Подтверждён ручной smoke в Telegram WebApp:
  - вход -> охота -> действие -> обновление состояния -> без критичных ошибок (проверено 2026-03-10).
- Добавлена UX-обработка сетевых/API ошибок во фронте:
  - нормализация `401`, network, timeout сообщений в API client/hooks.
- Локальный web-game smoke:
  - Playwright (`/hunt`, `click: Начать охоту`) + `render_game_to_text` -> OK (проверено 2026-03-10, `output/web-game/state-0.json`).
- Frontend patch 1.1 (2026-03-11/12) реализован без изменения backend-контрактов:
  - Hub: отдельные кнопки `Прокачка`/`Способности`/`Инвентарь`, Social (`Лидеры`/`Рефералы` + `Скоро`).
  - Upgrade: покупка карточек способностей за XP.
  - Abilities: просмотр купленных/доступных способностей.
  - Hunt 1.1: выбор локации (`Грот`), энка, Кристалл ночи, события, финальный выбор, голод, фамильяр.
  - Визуал: портрет скина в Hub/бою.
  - Smoke-артефакты: `output/web-game/patch11-smoke/*` и `patch11-smoke-summary.json` (все ключевые проверки=true).
- Patch 1.1 finish pass (2026-03-12):
  - Закрыт UX-gap боевого экрана на узком/низком viewport:
    - критичные блоки (`Действия`, `Фамильяр`, `Игрок HP/атака/защита/голод`) закреплены и не уходят за первый экран.
  - Отдельно проверено отсутствие регрессий маршрутов recovery baseline (`Hub/Hunt/Upgrade/Abilities/Inventory/Leaderboard/Referral`).
  - Расширенный smoke с 18 обязательными сценариями:
    - `output/web-game/patch11-finish-pass/summary.json`
    - все проверки = `true`.
- Проверка Stage 4 economy backend (локальный JWT smoke, 2026-03-10):
  - `GET /api/upgrade/options` -> OK
  - `POST /api/upgrade/buy` -> OK
  - `GET /api/inventory` -> OK
  - `GET /api/shop/items?type=default` -> OK
  - `POST /api/shop/buy` -> OK
- Проверка Stage 4 economy frontend:
  - Playwright smoke: `/#/upgrade`, `/#/inventory`, `/#/shop` -> без новых console errors (артефакты в `output/web-game/stage4-*`).
- Проверка Stage 4 social backend/frontend (локальный smoke, 2026-03-10):
  - `GET /api/leaderboard?limit=5&offset=0&filter=xp` -> OK
  - `GET /api/leaderboard/me` -> OK
  - `GET /api/referral/code` -> OK
  - `POST /api/referral/bonus` -> OK
  - Playwright smoke: `/#/leaderboard`, `/#/referral` + click actions (`По убийствам`, `Забрать 100 крови`) -> OK, без `errors-0.json`.
- Проверка notification + worker (docker no-bot smoke, 2026-03-10):
  - `POST /api/notification/send` -> `201`, `Notification queued`.
  - `POST /api/notification/reminder` -> `201`, `Reminder scheduled`.
  - Worker log подтверждает обработку queue jobs:
    - `[Notification] Job ... completed`
    - `[Reminder] Job ... completed`.
  - При отсутствии `TELEGRAM_BOT_TOKEN` worker явно пишет причину skip:
    - `Delivery skipped/failed ... TELEGRAM_BOT_TOKEN is not configured`.
  - При наличии `TELEGRAM_BOT_TOKEN` worker выполняет реальный вызов Telegram Bot API:
    - пример ответа transport: `Bad Request: chat not found` для тестового невалидного/неинициализированного chat_id.
  - Финальный live smoke с реальным chat_id (2026-03-10):
    - `POST /api/notification/send` -> `201`, `jobId=1`.
    - Bull job result: `state=completed`, `returnvalue.success=true`, `messageId=73`.
    - Worker log: `[Notification] Job 1 completed` без warning по доставке.
- Production bot infra:
  - `docker/docker-compose.prod.yml` содержит сервис `bot` с `restart: unless-stopped`.
  - Добавлен `docker/bot/Dockerfile`.
- 24/7 hardening бота:
  - heartbeat-файл + watchdog в `apps/bot/src/main.py` (при stale heartbeat процесс завершаетcя и перезапускается через Docker restart policy);
  - контейнерный healthcheck: `apps/bot/src/healthcheck.py` + `HEALTHCHECK` в `docker/bot/Dockerfile`;
  - оперативная диагностика: `bot-health.ps1`;
  - серверный one-command deploy: `deploy-bot.sh`.
- Бот-код проходит синтаксическую проверку:
  - `python -m compileall apps\bot\src` -> OK (проверено 2026-03-09).

## Что сломано

- Не подключены production-модули монетизации и live-delivery уведомлений:
  - `payment`

## Где смотреть логи

- Бот runtime (production):
  - `docker-compose -f docker/docker-compose.prod.yml logs -f bot`.
  - `powershell -ExecutionPolicy Bypass -File .\bot-health.ps1`.
- Бот runtime (local fallback):
  - окно терминала, в котором запущен `run-bot-only.bat`.
- Временные файлы pip при запуске батника:
  - `apps/bot/.tmp`.
- Проверка сборок:
  - запустить в корне проекта:
    - `npm run build --prefix apps/web`
    - `npm run build --prefix services/api`

## Актуальный путь запуска

1. Скопировать `.env.example` в `.env`.
2. Заполнить минимум:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBAPP_URL`
3. Для production: `docker-compose -f docker/docker-compose.prod.yml up -d --build`.
   - Рекомендуемый вариант: `docker-compose --env-file .env -f docker/docker-compose.prod.yml up -d --build`.
4. Для локального fallback: `run-bot-only.bat`.
5. В Telegram открыть бота, отправить `/start`, нажать `🎮 Играть`.

## Архив устаревших инструкций

- `docs/archive/2026-03-stage0/HOW_TO_RUN.md`
- `docs/archive/2026-03-stage0/RUN_WITHOUT_TELEGRAM.md`
