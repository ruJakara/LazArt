from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
import os
from urllib.parse import urlparse

_PLACEHOLDER_HOSTS = {
    "your-webapp-url.com",
    "example.com",
}


def _normalized_webapp_url() -> str | None:
    raw = (os.getenv("TELEGRAM_WEBAPP_URL") or os.getenv("WEB_APP_URL") or "").strip()
    if not raw:
        return None

    parsed = urlparse(raw)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in {"http", "https"}:
        return None
    if not host or host in _PLACEHOLDER_HOSTS:
        return None

    return raw


WEB_APP_URL = _normalized_webapp_url()


def is_webapp_configured() -> bool:
    return WEB_APP_URL is not None

def main_keyboard() -> ReplyKeyboardMarkup:
    """Основная клавиатура с кнопкой запуска игры"""
    play_button = (
        KeyboardButton(text="🎮 Играть", web_app=WebAppInfo(url=WEB_APP_URL))
        if WEB_APP_URL
        else KeyboardButton(text="🎮 Играть")
    )

    keyboard = [
        [
            play_button
        ],
        [
            KeyboardButton(text="🏆 Лидеры"),
            KeyboardButton(text="👥 Рефералы")
        ],
        [
            KeyboardButton(text="📖 Помощь")
        ]
    ]
    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        one_time_keyboard=False
    )

def referral_keyboard(referral_code: str) -> InlineKeyboardMarkup:
    """Клавиатура для шеринга реферального кода"""
    keyboard = [
        [
            InlineKeyboardButton(
                text="📋 Копировать код",
                callback_data=f"copy_referral_{referral_code}"
            )
        ],
        [
            InlineKeyboardButton(
                text="🔗 Поделиться ссылкой",
                switch_inline_query=f"Присоединяйся ко мне в Night Hunger! Реферальный код: {referral_code}"
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

def hunt_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура для быстрой охоты"""
    keyboard = [
        [
            InlineKeyboardButton(
                text="⚔️ Быстрая охота",
                callback_data="quick_hunt"
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

def help_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура помощи"""
    launch_button = (
        InlineKeyboardButton(text="🎮 Запустить игру", web_app=WebAppInfo(url=WEB_APP_URL))
        if WEB_APP_URL
        else InlineKeyboardButton(text="⚙️ Укажите TELEGRAM_WEBAPP_URL", callback_data="webapp_not_configured")
    )

    keyboard = [
        [
            launch_button
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)
