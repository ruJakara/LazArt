# VK Live Group Parser

Скрипт собирает живые группы VK и сохраняет результат в `live_groups.json`.

Критерий "живой группы": хотя бы один из первых 3 постов имеет `> 0` комментариев.

## Telegram-бот с оплатой 300 ₽ / месяц

В проекте есть бот `telegram_parser_bot.py` с подпиской:

- без активной подписки запуск парсинга недоступен;
- после успешной оплаты бот открывает доступ на `30` дней;
- дальше пользователь продлевает доступ новой оплатой.

### 1) Что нужно подготовить

1. Создать бота у `@BotFather` и получить `TELEGRAM_BOT_TOKEN`.
2. Подключить платежи в `@BotFather` и получить `PAYMENT_PROVIDER_TOKEN`.
3. Иметь рабочий `VK_TOKEN` для парсера.

### 2) Переменные окружения

PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN = "токен_бота"
$env:PAYMENT_PROVIDER_TOKEN = "токен_провайдера_оплаты"
$env:VK_TOKEN = "ваш_vk_токен"
$env:DISCOVERY_MODE = "auto"
```

Опционально:

```powershell
$env:SUBSCRIPTION_PRICE_RUB = "300"
$env:SUBSCRIPTION_DAYS = "30"
$env:TELEGRAM_ALLOWED_USERS = "123456789,987654321"
$env:TELEGRAM_ADMIN_USERS = "123456789"
```

### 3) Запуск

```powershell
.\run_telegram_bot.bat
```

После запуска:

1. Откройте бота в Telegram.
2. Отправьте `/start`.
3. Нажмите `Оплатить 300 ₽ / месяц`.
4. После оплаты нажмите `Запустить парсинг`.
5. Бот пришлет краткий список и файл `live_groups.json`.

## Деплой на VPS (systemd)

В папке есть готовые файлы для сервера:

- `deploy.sh` - обновление кода + зависимостей + перезапуск сервиса;
- `kiberone-group-parser.service` - unit-файл `systemd`;
- `.env.example` - шаблон переменных окружения;
- `DEPLOY.md` - пошаговая инструкция по установке.

## Локальный GUI (без Telegram)

1. Убедитесь, что установлен Python 3.10+.
2. Дважды кликните `run_parser_gui.bat`.
3. Вставьте `VK_TOKEN` и нажмите `Запустить парсинг`.
4. Откройте `live_groups.json` кнопкой в интерфейсе.

## Режимы поиска

`DISCOVERY_MODE`:

- `auto` - сначала `groups.search`, при недоступности fallback на `seed_groups.txt`;
- `keywords` - только по `KEYWORDS`;
- `seed` - только по `seed_groups.txt`.

## Файл seed_groups.txt

Поддерживает строки:

- `screen_name` (например `freelance_job`);
- ссылку `https://vk.com/...`;
- `club123456` / `public123456` / `123456`.

Пустые строки и строки с `#` игнорируются.

## Что делает парсер

- Ищет кандидатов через `groups.search` (если доступно токену).
- В fallback/seed режиме берет кандидатов из `seed_groups.txt`.
- Берет 3 поста через `wall.get`.
- Считает группу "живой", если в одном из постов `comments.count > 0`.
- Соблюдает rate limit: `time.sleep(0.34)` после каждого API-запроса.

## Файлы проекта

- `vk_live_parser.py` - основной парсер VK.
- `telegram_parser_bot.py` - Telegram-бот (подписка + запуск парсинга).
- `vk_live_parser_gui.py` - локальный GUI.
- `seed_groups.txt` - список групп для fallback.
- `run_telegram_bot.bat` - запуск Telegram-бота.
- `run_parser_gui.bat` - запуск GUI.
- `requirements.txt` - зависимости Python.
