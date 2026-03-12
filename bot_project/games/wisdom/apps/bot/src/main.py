import asyncio
import logging
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from handlers import router
from notifications import init_notification_service

logging.basicConfig(level=logging.INFO)

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

    # Инициализация диспетчера
    dp = Dispatcher()
    dp.include_router(router)

    # Установка команд меню
    from aiogram.types import BotCommand
    await bot.set_my_commands([
        BotCommand(command="start", description="Начать игру"),
        BotCommand(command="hunt", description="Начать охоту"),
        BotCommand(command="profile", description="Мой профиль"),
        BotCommand(command="leaderboard", description="Таблица лидеров"),
        BotCommand(command="referral", description="Рефералы"),
        BotCommand(command="help", description="Помощь"),
    ])

    logging.info("Bot started successfully!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
