# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Repository Overview

Telegram bot for KiberOne school — single-tenant architecture ("МОЙ ЦАРЬ" model). Built with Python, aiogram 3.x, SQLAlchemy (async), and optional AlfaCRM integration.

## Project Structure

```
bot_project/
├── main.py              # Entry point, bot startup
├── config.py            # Settings from .env (bot token, admin, CRM credentials)
├── models.py            # SQLAlchemy models (leads, bill requests, B2B, game results)
├── crm.py               # AlfaCRM API integration
├── handlers/            # Telegram bot handlers (menu, leads, games, admin)
├── core/                # Core utilities and shared logic
├── games/               # Static game files (HTML5 mini-games)
├── teGame/              # Legacy game files
├── tenants/             # Tenant YAML configs
├── apps/                # App modules
├── scripts/             # Utility scripts
└── shared/              # Shared modules
```

## Key Files

- `config.py` — All env vars loaded here via `get_settings()`, returns `Settings` dataclass
- `main.py` — Bot initialization and handler registration
- `models.py` — Database schema (async SQLAlchemy with aiosqlite)
- `crm.py` — AlfaCRM REST API client (token auth)
- `handlers/` — Each file handles a specific bot feature (games, leads, admin, etc.)

## Tech Stack

- **Python 3.11+**
- **aiogram 3.x** — Telegram Bot API framework
- **SQLAlchemy** (async) + **aiosqlite** — database
- **AlfaCRM API** — optional CRM integration
- **dotenv** — environment configuration

## Development Rules

- All config from `.env` — never hardcode secrets
- Database is `bot.db` (SQLite) in project root
- Games served as static HTML from `games/` and `teGame/` directories
- Admin commands require `ADMIN_TG_ID` match
- Keep handlers focused: one file per feature area
