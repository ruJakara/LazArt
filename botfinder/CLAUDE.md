# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Repository Overview

News monitoring Telegram bot for infrastructure & utilities sector (ЖКХ). Collects news from RSS feeds, filters by relevance using keyword scoring + LLM analysis (Perplexity AI / OpenRouter), and broadcasts signals to subscribed Telegram users.

## Project Structure

```
botfinder/
├── main.py              # Entry point, orchestration loop + Telegram bot startup
├── config.py            # Config class with scoring weights, keywords, thresholds
├── config_loader.py     # YAML-based config loading (config/config.yaml)
├── secrets.py           # API keys and tokens from .env
├── settings.py          # Runtime settings
├── rss.py               # RSS feed fetcher and parser
├── news_collector.py    # News collection orchestration
├── filter1.py           # Stage 1 keyword-based filtering
├── ai_filter.py         # Stage 2 LLM-based relevance analysis
├── signals.py           # Signal generation and formatting
├── decision.py          # Decision logic for article relevance
├── llm.py               # LLM API client (Perplexity / OpenRouter)
├── database.py          # SQLite database operations
├── telegram_bot.py      # Telegram bot handlers and commands
├── broadcaster.py       # Message broadcasting to subscribers
├── admin.py             # Admin panel and commands
├── region.py            # Regional filtering logic
├── dedup.py             # Article deduplication
├── freshness.py         # Article freshness scoring
├── noise.py             # Noise filtering
├── sources.json         # RSS source definitions
├── config/config.yaml   # Main YAML configuration
└── ui_*.py              # UI components (keyboards, screens, callbacks)
```

## Key Modules

- **Pipeline**: `rss.py` → `filter1.py` → `ai_filter.py` → `signals.py` → `broadcaster.py`
- **Config**: dual system — `config.py` (Python class) + `config_loader.py` (YAML)
- **Secrets**: all API keys in `secrets.py` via `.env`
- **Database**: `database.py` with SQLite (`news_monitor.db`)
- **Bot UI**: `telegram_bot.py` + `ui_keyboards.py` + `ui_screens.py` + `ui_callbacks.py`

## Tech Stack

- **Python 3.11+**
- **aiogram 3.x** — Telegram Bot API
- **Perplexity AI / OpenRouter** — LLM for article relevance analysis
- **feedparser** — RSS parsing
- **aiosqlite** — async SQLite
- **aiohttp** — HTTP client for API calls
- **dotenv** — environment configuration

## Development Rules

- All API keys in `.env` → loaded via `secrets.py`
- Two-stage filtering: keyword score first, then LLM only if score ≥ threshold
- Sources defined in `sources.json` — editable without code changes
- Config YAML in `config/config.yaml` for runtime tuning
- Never commit `.env`, `news_monitor.db`, or `logs.txt`
