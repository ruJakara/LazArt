"""User command handlers for Telegram bot.

Per ТЗ — all user actions logged, no personal data stored.
First /start triggers initial news search with 2-8 min notification.
"""
import asyncio
from aiogram import Router
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton

from db_pkg import get_session, SubscriberRepository
from settings import get_settings
from logging_setup import get_logger
from config_loader import get_config
from ui_keyboards import cb
from ui_callbacks import show_panel

logger = get_logger("bot.user")
router = Router(name="user")


def mask_chat_id(chat_id: int) -> str:
    """Mask chat_id for logging (last 4 digits)."""
    s = str(abs(chat_id))
    if len(s) <= 4:
        return s
    return "..." + s[-4:]


@router.message(CommandStart())
async def cmd_start(message: Message):
    """Handle /start command - subscribe user and show welcome."""
    chat_id = message.chat.id
    # Get user display name
    user = message.from_user
    display_name = user.first_name or user.username or "друг"
    settings = get_settings()
    cfg = get_config()
    msgs = cfg.ui.messages

    async with get_session() as session:
        subscriber, created = await SubscriberRepository.get_or_create(
            session,
            chat_id=chat_id
        )

        # If was inactive, reactivate
        if not created and not subscriber.is_active:
            await SubscriberRepository.set_active(session, chat_id, True)
            created = True  # Treat as new for message

        await session.commit()

    # Log per ТЗ
    logger.info(
        "user_command",
        chat_id=mask_chat_id(chat_id),
        command="/start",
        result="subscribed" if created else "already_subscribed"
    )

    # Build welcome text with nickname
    greeting = f"Привет, <b>{display_name}</b>! 👋\n\n"

    if created:
        body = (
            "PRSBOT — мониторинг открытых новостей РФ "
            "по ЖКХ и промышленности.\n"
            "Присылаю только значимые сигналы "
            "(аварии/остановки/срочный ремонт).\n"
            "Лимит: до 5 сигналов в сутки. "
            "Дубли и шум отсеиваются.\n\n"
            "✅ Подписка активирована!"
        )
    else:
        body = (
            "С возвращением!\n"
            "Ваша подписка уже активна.\n"
            "Продолжаю мониторинг для вас."
        )

    welcome_text = greeting + body

    # Add admin suffix if admin
    if chat_id == settings.admin_chat_id:
        welcome_text += msgs.admin_suffix

    # Button label per spec
    btn_label = "➡️ Продолжить" if created else "➡️ Продолжить"
    btn_target = "first_check" if created else "menu"

    # Show welcome
    await message.answer(
        welcome_text,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=btn_label, callback_data=cb(btn_target))]
        ]),
        parse_mode="HTML"
    )


@router.message(Command("menu"))
async def cmd_menu(message: Message):
    """Show inline menu panel."""
    from ui_callbacks import is_allowed

    # Check permissions in groups
    if message.chat.type in ("group", "supergroup"):
        if not is_allowed(message.from_user.id):
            return

    logger.info("user_command", chat_id=mask_chat_id(message.chat.id), command="/menu")
    await show_panel(message)


@router.message(Command("stop"))
async def cmd_stop(message: Message):
    """Handle /stop command - unsubscribe user."""
    chat_id = message.chat.id
    cfg = get_config()

    async with get_session() as session:
        await SubscriberRepository.set_active(session, chat_id, False)
        await session.commit()

    logger.info(
        "user_command",
        chat_id=mask_chat_id(chat_id),
        command="/stop",
        result="unsubscribed"
    )

    await message.answer(cfg.ui.messages.stop, parse_mode="HTML")


@router.message(Command("help"))
async def cmd_help(message: Message):
    """Handle /help command."""
    logger.info(
        "user_command",
        chat_id=mask_chat_id(message.chat.id),
        command="/help",
        result="ok"
    )

    cfg = get_config()
    await message.answer(cfg.ui.messages.help, parse_mode="HTML")


@router.message(Command("status"))
async def cmd_status(message: Message):
    """Handle /status command."""
    chat_id = message.chat.id

    async with get_session() as session:
        subscriber, _ = await SubscriberRepository.get_or_create(
            session,
            chat_id=chat_id
        )
        is_active = subscriber.is_active
        await session.commit()

    logger.info(
        "user_command",
        chat_id=mask_chat_id(chat_id),
        command="/status",
        result="active" if is_active else "inactive"
    )

    if is_active:
        cfg = get_config()
        text = (
            f"✅ <b>Подписка активна</b>\n\n"
            f"📩 Лимит сигналов: {cfg.limits.max_signals_per_day}/сутки\n"
            f"🕐 Проверка источников: каждые {cfg.schedule.check_interval_minutes} мин\n"
            f"📡 Источников: {len(cfg.sources)}"
        )
    else:
        text = "❌ <b>Подписка выключена</b>\n\nВключить снова: /start"

    await message.answer(text, parse_mode="HTML")


@router.message(Command("privacy"))
async def cmd_privacy(message: Message):
    """Handle /privacy command — data policy."""
    logger.info(
        "user_command",
        chat_id=mask_chat_id(message.chat.id),
        command="/privacy",
        result="ok"
    )

    cfg = get_config()
    await message.answer(cfg.ui.messages.privacy, parse_mode="HTML")
