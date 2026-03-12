import asyncio
import logging
import os
import tempfile
import threading
import time
from contextlib import suppress
from pathlib import Path
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from handlers import router
from notifications import init_notification_service

logging.basicConfig(level=logging.INFO)
RESTART_DELAY_SECONDS = 5
HEARTBEAT_INTERVAL_SECONDS = max(5, int(os.getenv("BOT_HEARTBEAT_INTERVAL_SECONDS", "15")))
HEARTBEAT_STALE_AFTER_SECONDS = max(
    HEARTBEAT_INTERVAL_SECONDS * 3,
    int(os.getenv("BOT_HEARTBEAT_STALE_AFTER_SECONDS", "90")),
)
HEARTBEAT_FILE = Path(
    os.getenv("BOT_HEARTBEAT_FILE")
    or (Path(tempfile.gettempdir()) / "night_hunger_bot_heartbeat.txt")
)
WATCHDOG_CHECK_INTERVAL_SECONDS = min(HEARTBEAT_INTERVAL_SECONDS, 10)

_heartbeat_lock = threading.Lock()
_last_heartbeat_monotonic = time.monotonic()


def touch_heartbeat() -> None:
    global _last_heartbeat_monotonic

    try:
        HEARTBEAT_FILE.parent.mkdir(parents=True, exist_ok=True)
        HEARTBEAT_FILE.write_text(str(int(time.time())), encoding="utf-8")
    except Exception:
        logging.exception("Failed to update heartbeat file: %s", HEARTBEAT_FILE)

    with _heartbeat_lock:
        _last_heartbeat_monotonic = time.monotonic()


async def heartbeat_loop() -> None:
    while True:
        touch_heartbeat()
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)


def watchdog_loop(stop_event: threading.Event) -> None:
    while not stop_event.wait(WATCHDOG_CHECK_INTERVAL_SECONDS):
        with _heartbeat_lock:
            stale_for_seconds = time.monotonic() - _last_heartbeat_monotonic

        if stale_for_seconds > HEARTBEAT_STALE_AFTER_SECONDS:
            logging.critical(
                "Bot heartbeat is stale for %.1f seconds (threshold: %s). Exiting for restart.",
                stale_for_seconds,
                HEARTBEAT_STALE_AFTER_SECONDS,
            )
            os._exit(1)


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.include_router(router)
    return dp

async def main():
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token or bot_token == "your_bot_token_here":
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before starting the bot.")

    # Инициализация бота
    bot = Bot(
        token=bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    # Если на боте раньше стоял webhook, polling не будет получать апдейты.
    await bot.delete_webhook(drop_pending_updates=True)

    # Инициализация сервиса уведомлений
    init_notification_service(bot)

    # Установка команд меню
    from aiogram.types import BotCommand
    commands = [
        BotCommand(command="start", description="Начать игру"),
        BotCommand(command="hunt", description="Начать охоту"),
        BotCommand(command="profile", description="Мой профиль"),
        BotCommand(command="leaderboard", description="Таблица лидеров"),
        BotCommand(command="referral", description="Рефералы"),
        BotCommand(command="help", description="Помощь"),
    ]

    touch_heartbeat()
    watchdog_stop_event = threading.Event()
    watchdog_thread = threading.Thread(
        target=watchdog_loop,
        args=(watchdog_stop_event,),
        name="bot-heartbeat-watchdog",
        daemon=True,
    )
    watchdog_thread.start()

    logging.info("Bot heartbeat file: %s", HEARTBEAT_FILE)
    logging.info(
        "Heartbeat interval=%ss, stale threshold=%ss",
        HEARTBEAT_INTERVAL_SECONDS,
        HEARTBEAT_STALE_AFTER_SECONDS,
    )

    try:
        while True:
            heartbeat_task = asyncio.create_task(heartbeat_loop())
            try:
                await bot.set_my_commands(commands)
                dp = build_dispatcher()
                logging.info("Bot started successfully!")
                await dp.start_polling(
                    bot,
                    allowed_updates=dp.resolve_used_update_types(),
                )
                break
            except asyncio.CancelledError:
                raise
            except Exception:
                logging.exception(
                    "Polling stopped unexpectedly. Restarting in %s seconds...",
                    RESTART_DELAY_SECONDS,
                )
                await asyncio.sleep(RESTART_DELAY_SECONDS)
            finally:
                heartbeat_task.cancel()
                with suppress(asyncio.CancelledError):
                    await heartbeat_task
    finally:
        watchdog_stop_event.set()
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
