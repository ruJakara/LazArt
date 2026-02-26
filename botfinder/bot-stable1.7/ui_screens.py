"""UI Screen Renderers — live data from DB per spec."""
from datetime import datetime, timedelta
from typing import Optional

from settings import get_settings
from logging_setup import get_logger

logger = get_logger("ui.screens")

APP_VERSION = "2.0.0"


def header(breadcrumbs: str) -> str:
    return f"<b>{breadcrumbs}</b>\n\n"


# ──────────────────────────────────────
# PUBLIC SCREENS
# ──────────────────────────────────────

async def render_main(is_admin: bool = False) -> str:
    """Menu — minimal."""
    return (
        "<b>Меню PRSBOT</b>\n\n"
        "Выберите действие:"
    )


async def render_check() -> str:
    """✅ Проверить — live system status."""
    from db_pkg import get_session, SignalRepository
    from llm_monitor import CircuitBreaker
    from config_loader import get_config
    from sqlalchemy import text as sql_text

    cfg = get_config()

    # DB check
    db_ok = False
    try:
        async with get_session() as session:
            await session.execute(sql_text("SELECT 1"))
            db_ok = True
    except Exception:
        pass

    # Signals today
    try:
        async with get_session() as session:
            sent_today = await SignalRepository.count_today(session)
    except Exception:
        sent_today = 0

    # LLM status
    if CircuitBreaker.is_open():
        llm_status = "⚠️ DEGRADED"
    else:
        llm_status = "✅ OK"

    # Sources count
    sources_total = len(cfg.sources)
    pipeline = "RUNNING"
    interval = cfg.schedule.check_interval_minutes

    return (
        "<b>Проверка системы</b>\n\n"
        f"Pipeline: <b>{pipeline}</b>\n"
        f"Сегодня сигналов: <b>{sent_today}</b>/{cfg.limits.max_signals_per_day}\n"
        f"LLM: {llm_status}\n"
        f"Источники: {sources_total} подключено\n"
        f"БД: {'✅ OK' if db_ok else '❌ Ошибка'}\n"
        f"Интервал: каждые {interval} мин\n\n"
        "<i>Нажмите «🔍 Запустить проверку» чтобы\n"
        "просканировать источники прямо сейчас.</i>"
    )


def render_check_result(result: dict) -> str:
    """Format pipeline result for display."""
    if not result:
        return "<b>⚠️ Нет данных</b>"

    status = result.get("status", "unknown")

    if status == "locked":
        return result.get("message", "⏳ Занято")

    if status == "error":
        return f"<b>❌ Ошибка проверки</b>\n\n{result.get('message', '')}"

    if status == "empty":
        return (
            "<b>✅ Проверка завершена</b>\n\n"
            "📡 Источники просканированы.\n"
            "Новых публикаций не обнаружено.\n\n"
            "<i>Всё спокойно — нет свежих новостей.</i>"
        )

    # Real results
    raw = result.get("raw", 0)
    new = result.get("new", 0)
    signals = result.get("signals", 0)
    duration = result.get("duration_ms", 0)
    filtered_old = result.get("filtered_old", 0)
    filtered_resolved = result.get("filtered_resolved", 0)
    filtered_noise = result.get("filtered_noise", 0)
    filtered_combo = result.get("filtered_combo", 0)
    filtered_score = result.get("filtered_score", 0)
    llm_failed = result.get("llm_failed", 0)
    llm_skipped = result.get("llm_skipped", 0)
    first_run_skipped = result.get("first_run_skipped", 0)
    errors = result.get("errors", 0)

    # Signal indicator
    if signals > 0:
        signal_line = f"🔔 <b>Отправлено сигналов: {signals}</b>"
    else:
        signal_line = "✅ Значимых событий не обнаружено"

    # Build funnel
    total_filtered = filtered_old + filtered_resolved + filtered_noise + filtered_combo + filtered_score

    text = (
        f"<b>✅ Проверка завершена</b>\n\n"
        f"{signal_line}\n\n"
        f"<b>📊 Воронка обработки:</b>\n"
        f"├ Получено: {raw}\n"
        f"├ Уникальных: {new}\n"
    )

    if total_filtered > 0:
        text += f"├ Отсеяно: {total_filtered}\n"
        if filtered_old:
            text += f"│  └ устарели: {filtered_old}\n"
        if filtered_noise:
            text += f"│  └ шум: {filtered_noise}\n"
        if filtered_resolved:
            text += f"│  └ решено: {filtered_resolved}\n"
        if filtered_combo + filtered_score:
            text += f"│  └ не прошли фильтр: {filtered_combo + filtered_score}\n"

    if llm_skipped:
        text += f"├ LLM пропущено: {llm_skipped}\n"
    if llm_failed:
        text += f"├ LLM ошибки: {llm_failed}\n"
    if first_run_skipped:
        text += f"├ Первый запуск (пропуск): {first_run_skipped}\n"

    text += f"└ Сигналов: <b>{signals}</b>\n"

    if errors:
        text += f"\n⚠️ Ошибок: {errors}"

    # Duration
    if duration > 0:
        sec = duration / 1000
        text += f"\n\n⏱ Время: {sec:.1f}с"

    return text


async def render_stats(period: str = "24h") -> str:
    """📊 Статистика — live from DB."""
    from db_pkg import get_session, NewsRepository, SignalRepository

    days = 1 if period == "24h" else 7
    period_label = "24 часа" if period == "24h" else "7 дней"

    try:
        async with get_session() as session:
            stats = await NewsRepository.get_stats(session, days=days)
            sent = await SignalRepository.count_today(session) if days == 1 else len(
                await SignalRepository.get_recent(session, days=days))
    except Exception:
        stats = {}
        sent = 0

    processed = stats.get("total", 0)
    by_status = stats.get("by_status", {})
    filtered = by_status.get("filtered", 0)
    duplicates = by_status.get("duplicate", 0)
    noise = by_status.get("filtered_noise", 0) + by_status.get("filtered_resolved", 0)
    suppressed = by_status.get("suppressed_limit", 0)
    filter1_pass = by_status.get("llm_passed", 0) + by_status.get("sent", 0) + by_status.get("llm_failed", 0)
    llm_pass = by_status.get("llm_passed", 0) + by_status.get("sent", 0)

    return (
        f"<b>Статистика ({period_label})</b>\n\n"
        f"Обработано: {processed}\n"
        f"Filter1 прошло: {filter1_pass}\n"
        f"LLM прошло: {llm_pass}\n"
        f"Отправлено сигналов: <b>{sent}</b>\n"
        f"Дубликаты: {duplicates}\n"
        f"Шум/отсечено: {noise + filtered}\n"
        f"Лимит подавил: {suppressed}"
    )


async def render_stats_sources() -> str:
    """Топ источники — live from DB."""
    from db_pkg import get_session
    from sqlalchemy import select, func
    from models import News

    try:
        async with get_session() as session:
            cutoff = datetime.utcnow() - timedelta(days=7)
            result = await session.execute(
                select(News.source, func.count(News.id).label("cnt"))
                .where(News.collected_at >= cutoff)
                .group_by(News.source)
                .order_by(func.count(News.id).desc())
                .limit(5)
            )
            rows = result.all()
    except Exception:
        rows = []

    if not rows:
        return "<b>Топ источники</b>\n\nПока нет данных."

    text = "<b>Топ источники (7д)</b>\n\n"
    for i, (source, cnt) in enumerate(rows, 1):
        text += f"{i}. {source}: {cnt}\n"
    return text


async def render_stats_regions() -> str:
    """По регионам — live from DB."""
    from db_pkg import get_session
    from sqlalchemy import select, func
    from models import Signal

    try:
        async with get_session() as session:
            cutoff = datetime.utcnow() - timedelta(days=7)
            result = await session.execute(
                select(Signal.region, func.count(Signal.id).label("cnt"))
                .where(Signal.sent_at >= cutoff)
                .where(Signal.region.isnot(None))
                .group_by(Signal.region)
                .order_by(func.count(Signal.id).desc())
                .limit(5)
            )
            rows = result.all()
    except Exception:
        rows = []

    if not rows:
        return "<b>По регионам</b>\n\nПока нет данных."

    text = "<b>Сигналы по регионам (7д)</b>\n\n"
    for i, (region, cnt) in enumerate(rows, 1):
        text += f"{i}. {region}: {cnt}\n"
    return text


async def render_settings() -> str:
    """⚙️ Настройки — user-facing."""
    settings = get_settings()
    return (
        "<b>Настройки (интерфейс)</b>\n\n"
        f"🌐 Язык: RU\n"
        f"🕑 Часовой пояс: MSK\n"
        f"📋 /status: расширенный\n"
        f"📨 /last по умолчанию: 5"
    )


async def render_settings_lang(current: str = "ru") -> str:
    return "<b>Язык интерфейса</b>\n\nВыберите язык:"


async def render_settings_tz(current: str = "msk") -> str:
    now = datetime.now().strftime("%H:%M:%S")
    return (
        "<b>Часовой пояс</b>\n\n"
        f"Текущее время: {now}"
    )


async def render_settings_last(n: int = 5) -> str:
    return (
        "<b>Количество /last</b>\n\n"
        f"Сейчас: <b>{n}</b> последних сигналов"
    )


async def render_about() -> str:
    """ℹ️ Об авторе."""
    return (
        "<b>Автор</b>\n\n"
        "Разраб любит кофе, но не откажется от чая.\n"
        "Контакт: @SalutByBase"
    )


# ──────────────────────────────────────
# ADMIN SCREENS
# ──────────────────────────────────────

async def render_admin() -> str:
    """Admin dashboard — live summary."""
    from db_pkg import get_session, SignalRepository
    from llm_monitor import CircuitBreaker

    try:
        async with get_session() as session:
            sent_today = await SignalRepository.count_today(session)
    except Exception:
        sent_today = 0

    pipeline = "RUNNING"
    llm_err = CircuitBreaker._errors.__len__() if CircuitBreaker._errors else 0

    return (
        "<b>Админка</b>\n\n"
        f"Pipeline: <b>{pipeline}</b> · "
        f"Сегодня: <b>{sent_today}</b>/5 · "
        f"Ошибки (1ч): LLM {llm_err}"
    )


async def render_control(is_paused: bool, status: dict = None) -> str:
    state = "⏸ ПАУЗА" if is_paused else "▶️ РАБОТАЕТ"
    text = (
        f"{header('Админка → Управление')}"
        f"Состояние: <b>{state}</b>\n"
    )
    if status:
        now = datetime.now().strftime("%H:%M:%S")
        text += (
            f"\n📉 <b>Live</b> ({now}):\n"
            f"• В очереди: {status.get('pending', 0)}\n"
            f"• Ошибки (1ч): {status.get('errors_1h', 0)}\n"
            f"• Сигналов (24ч): {status.get('signals_24h', 0)}\n"
        )
    return text


async def render_sources(sources: list, page: int, total: int = 1) -> str:
    enabled = sum(1 for s in sources if (s.get("enabled", True) if isinstance(s, dict) else getattr(s, "is_enabled", True)))
    return (
        f"{header(f'Админка → Источники ({page+1}/{total})')}"
        f"Всего: {len(sources)} · Активно: {enabled}\n"
        "Нажмите для вкл/выкл:"
    )


async def render_filters() -> str:
    from config_loader import get_config
    c = get_config()
    return (
        f"{header('Админка → Пороги')}"
        "Настройка порогов (Hot Reload):\n\n"
        f"• Filter1 Score: <b>{c.thresholds.filter1_to_llm}</b>\n"
        f"• Relevance: <b>{c.thresholds.llm_relevance}</b>\n"
        f"• Urgency: <b>{c.thresholds.llm_urgency}</b>"
    )


async def render_limits() -> str:
    from config_loader import get_config
    c = get_config()
    return (
        f"{header('Админка → Лимиты/Ранжирование')}"
        f"• Макс. сигналов/день: <b>{c.limits.max_signals_per_day}</b>\n"
        f"• Размер батча: {c.limits.max_processing_batch}"
    )


async def render_diag() -> str:
    return f"{header('Админка → Диагностика')}Выбор инструмента:"


async def render_confirm(action: str) -> str:
    actions_ru = {
        "toggle_pipeline": "Пауза/Запуск пайплайна",
        "force_run": "Принудительный запуск цикла",
        "cleanup": "Очистка старых записей БД",
    }
    label = actions_ru.get(action, action)
    return (
        f"{header('Подтверждение')}"
        f"Вы уверены?\n<b>{label}</b>"
    )


async def render_llm_center(stats: dict = None) -> str:
    """LLM Center — live data."""
    from llm_monitor import LLMMonitor

    if not stats:
        try:
            cost, _ = await LLMMonitor.get_daily_usage()
            stats = {"cost": cost, "requests": 0, "tokens": 0, "errors": 0}
        except Exception:
            stats = {"requests": 0, "tokens": 0, "cost": 0.0, "errors": 0}

    return (
        "<b>🧠 LLM Center</b>\n\n"
        f"<b>24ч:</b>\n"
        f"• Запросов: {stats.get('requests', 0)}\n"
        f"• Токенов: {stats.get('tokens', 0)}\n"
        f"• Ошибок: {stats.get('errors', 0)}\n"
        f"• Расход: ${stats.get('cost', 0.0):.4f}"
    )


async def render_reports() -> str:
    """Weekly report screen."""
    from weekly import generate_weekly_report
    try:
        report = await generate_weekly_report()
        return report
    except Exception as e:
        logger.error("render_reports_error", error=str(e))
        return (
            f"{header('Отчёты')}"
            "⚠️ Ошибка генерации отчёта."
        )


async def render_history(history: list, page: int = 0, total: int = 1) -> str:
    if not history:
        return f"{header('История')}Пусто."
    text = f"{header(f'История ({page+1}/{total})')}"
    for item in history:
        ts = item.timestamp.strftime("%d.%m %H:%M")
        text += f"✏️ {ts} | <code>{item.key}</code>\n{item.old_value} → {item.new_value}\n\n"
    return text


async def render_diff(diff: dict) -> str:
    if not diff:
        return f"{header('Diff')}✅ Нет изменений."
    text = f"{header('Diff')}"
    for key, vals in diff.items():
        text += f"🔧 <b>{key}</b>\nBase: <code>{vals['base']}</code>\nCurr: <code>{vals['current']}</code>\n\n"
    return text
