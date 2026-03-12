# Bot-Only Quick Start

This mode runs only the Telegram bot and skips API, worker, database, and Docker services.
Use this for local diagnostics/fallback. In production use Docker Compose (`docker/docker-compose.prod.yml`) so bot restarts automatically.

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
- `BOT_HEARTBEAT_INTERVAL_SECONDS` (optional, default: `15`)
- `BOT_HEARTBEAT_STALE_AFTER_SECONDS` (optional, default: `90`)

## Health Check

From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\bot-health.ps1
```
