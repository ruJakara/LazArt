import asyncio
import logging
from aiogram import Bot

async def send_push_notification(bot: Bot, user_id: int, message: str):
    """Отправка push-уведомления пользователю."""
    try:
        await bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="HTML"
        )
        logging.info(f"Push sent to user {user_id}")
    except Exception as e:
        logging.error(f"Failed to send push to user {user_id}: {e}")

async def schedule_notification(bot: Bot, user_id: int, delay: int, message: str):
    """Отложенное уведомление."""
    await asyncio.sleep(delay)
    await send_push_notification(bot, user_id, message)
