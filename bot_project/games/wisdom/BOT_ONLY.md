# Bot-Only Quick Start

This mode runs only the Telegram bot and skips API, worker, database, and Docker services.

## Windows

1. Open project folder.
2. Run:

```bat
run-bot-only.bat
```

3. Provide `TELEGRAM_BOT_TOKEN` when prompted.

## Optional Environment Variables

- `TELEGRAM_BOT_TOKEN` (required)
- `TELEGRAM_WEBAPP_URL` (optional, default: `https://example.com`)
