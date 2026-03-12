import logging
from aiogram import Bot
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationService:
    """Сервис для отправки уведомлений пользователям через Telegram Bot"""

    def __init__(self, bot: Bot):
        self.bot = bot

    async def send_push(
        self,
        user_id: int,
        message: str,
        parse_mode: str = "HTML",
    ) -> bool:
        """
        Отправить push-уведомление пользователю

        Args:
            user_id: Telegram user ID
            message: Текст сообщения
            parse_mode: Режим парсинга (HTML/Markdown)

        Returns:
            bool: True если успешно
        """
        try:
            await self.bot.send_message(
                chat_id=user_id,
                text=message,
                parse_mode=parse_mode,
            )
            logger.info(f"Notification sent to user {user_id}: {message}")
            return True
        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {e}")
            return False

    async def send_hunt_reminder(
        self,
        user_id: int,
        bonus_energy: int = 0,
    ) -> bool:
        """
        Отправить напоминание об охоте

        Args:
            user_id: Telegram user ID
            bonus_energy: Бонусная энергия (если есть)

        Returns:
            bool: True если успешно
        """
        message = (
            "🌙 <b>Ночь наступает!</b>\n\n"
            "Пришло время для охоты, охотник!\n"
            f"{'🎁 Вас ждёт бонус: ' + str(bonus_energy) + ' энергии!' if bonus_energy > 0 else ''}\n\n"
            "Не упусти шанс увеличить свой рейтинг!"
        )

        return await self.send_push(user_id, message)

    async def send_level_up(
        self,
        user_id: int,
        new_level: int,
    ) -> bool:
        """
        Отправить уведомление о повышении уровня

        Args:
            user_id: Telegram user ID
            new_level: Новый уровень

        Returns:
            bool: True если успешно
        """
        message = (
            f"🎉 <b>Новый уровень!</b>\n\n"
            f"Поздравляем! Вы достигли уровня <b>{new_level}</b>!\n\n"
            "Вам доступны новые улучшения и предметы в магазине."
        )

        return await self.send_push(user_id, message)

    async def send_leaderboard_reward(
        self,
        user_id: int,
        rank: int,
        reward: int,
    ) -> bool:
        """
        Отправить уведомление о награде за место в лидерборде

        Args:
            user_id: Telegram user ID
            rank: Занятое место
            reward: Размер награды

        Returns:
            bool: True если успешно
        """
        emoji = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else "🏆"

        message = (
            f"{emoji} <b>Награда за лидерборд!</b>\n\n"
            f"Вы заняли <b>{rank} место</b> в таблице лидеров!\n"
            f"🎁 Ваша награда: <b>{reward} крови</b>\n\n"
            "Продолжайте в том же духе!"
        )

        return await self.send_push(user_id, message)

    async def send_referral_bonus(
        self,
        user_id: int,
        bonus: int,
        referred_count: int,
    ) -> bool:
        """
        Отправить уведомление о бонусе за реферала

        Args:
            user_id: Telegram user ID
            bonus: Размер бонуса
            referred_count: Количество рефералов

        Returns:
            bool: True если успешно
        """
        message = (
            f"🎁 <b>Реферальный бонус!</b>\n\n"
            f"Вы получили <b>{bonus} крови</b> за {referred_count} реферал(ов)!\n\n"
            "Приглашайте ещё друзей и получайте больше наград!"
        )

        return await self.send_push(user_id, message)

    async def send_payment_completed(
        self,
        user_id: int,
        amount: int,
        currency: str,
    ) -> bool:
        """
        Отправить уведомление об успешном платеже

        Args:
            user_id: Telegram user ID
            amount: Сумма платежа
            currency: Валюта

        Returns:
            bool: True если успешно
        """
        message = (
            f"✅ <b>Платёж успешен!</b>\n\n"
            f"Вы пополнили баланс на <b>{amount} {currency}</b>.\n\n"
            "Спасибо за поддержку! Удачи на охоте!"
        )

        return await self.send_push(user_id, message)


# Глобальный экземпляр для использования в других модулях
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> Optional[NotificationService]:
    """Получить экземпляр сервиса уведомлений"""
    return _notification_service


def init_notification_service(bot: Bot) -> NotificationService:
    """Инициализировать сервис уведомлений"""
    global _notification_service
    _notification_service = NotificationService(bot)
    return _notification_service
