# Changelog

## [2.0.0] - 2026-02-12

### 🔴 Исправления критических ошибок
- Удалены 7 дубликатов Google News источников в `config.yaml` (вызывали двойной fetch)
- Исправлено `max_age_days`: 21 → 2 дня (по ТЗ)
- Исправлен путь к `config.yaml` в `config_loader.py`
- Переименован Cyrillic-ключ `бытовое_шум` → `household_noise`
- `ops_http.py`: `print()` → `logger.info()`

### 🟠 Живой UI (замена hardcoded данных)
- `ui_screens.py`: полная переработка — все 10 экранов показывают live-данные из БД
- `render_health()` — реальный ping БД и статус circuit breaker
- `render_stats()` — данные из `NewsRepository` и `SignalRepository`
- `render_about()` — динамическая версия v2.0.0
- Реализован экран "Отчёты" (ранее заглушка "Not imp.")

### 🟡 Унификация языка
- Все кнопки переведены на русский (Force Run → Принуд. запуск, Self-Check → Самопроверка, и т.д.)

### 🟢 Качество пайплайна
- `weekly.py`: заменён N+1 запрос на JOIN
- `user.py`: тексты /help, /privacy, /start из `config.yaml` вместо hardcode
- `weekly.py`: `datetime.now()` → `datetime.utcnow()`

### 🔵 Полировка
- Версия: 2.0.0 (`pyproject.toml`, `main.py`)
- Dockerfile: добавлены `LABEL version`, `LABEL description`
- docker-compose: добавлена ротация логов (`max-size: 10m`, `max-file: 3`)

## [1.7.0] - 2026-02-12

### Stability & Reliability
- Atomic daily signal limits (5/day, IMMEDIATE transactions)
- LLM JSON retries + circuit breaker + Pydantic validation
- Rate-limited broadcaster with auto-deactivation
- Implemented `ProcessingLock` for concurrency safety

### Security
- API keys masked in all log output
- Strict admin permission checks

### Deployment
- Production-ready Docker setup (non-root user, healthchecks)
- Graceful shutdown handling (SIGTERM/SIGINT)

### Testing
- Offline unit tests (URL norm, SimHash, Filter1, LLM)
- E2E smoke tests with mocks
