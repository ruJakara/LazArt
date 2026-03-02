from __future__ import annotations

import logging

from aiogram import Bot, F, Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    Contact,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

from config import get_settings
from core.notify import notify_admin
from models import AsyncSessionLocal, Lead, get_or_create_user

logger = logging.getLogger(__name__)
router = Router(name="leads")
settings = get_settings()


class LeadStates(StatesGroup):
    waiting_for_child_name = State()
    waiting_for_child_age = State()
    waiting_for_interest = State()
    waiting_for_phone = State()
    waiting_for_comment = State()


def _interest_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="👶 Детская группа"), KeyboardButton(text="🧑 Взрослая группа")],
        ],
        resize_keyboard=True,
    )


def _phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Отправить номер", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def _skip_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="⏭ Пропустить")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


_VALID_INTERESTS = {"👶 Детская группа", "🧑 Взрослая группа"}


@router.message(F.text == "📝 Записаться / пробное")
async def start_lead(message: Message, state: FSMContext) -> None:
    await state.set_state(LeadStates.waiting_for_child_name)
    await message.answer(
        "📝 Запись на пробное занятие\n\nКак зовут ребёнка?",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(LeadStates.waiting_for_child_name)
async def handle_child_name(message: Message, state: FSMContext) -> None:
    name = (message.text or "").strip()
    if not name:
        await message.answer("Пожалуйста, введите имя ребёнка.")
        return
    await state.update_data(child_name=name)
    await state.set_state(LeadStates.waiting_for_child_age)
    await message.answer("Сколько лет ребёнку?")


@router.message(LeadStates.waiting_for_child_age)
async def handle_child_age(message: Message, state: FSMContext) -> None:
    age = (message.text or "").strip()
    if not age.isdigit():
        await message.answer("Пожалуйста, введите возраст цифрой (например: 10).")
        return
    await state.update_data(child_age=age)
    await state.set_state(LeadStates.waiting_for_interest)
    await message.answer(
        "Что интересует?",
        reply_markup=_interest_keyboard(),
    )


@router.message(LeadStates.waiting_for_interest)
async def handle_interest(message: Message, state: FSMContext) -> None:
    interest = (message.text or "").strip()
    if interest not in _VALID_INTERESTS:
        await message.answer("Выберите один из вариантов:", reply_markup=_interest_keyboard())
        return
    await state.update_data(interest=interest)
    await state.set_state(LeadStates.waiting_for_phone)
    await message.answer(
        "📱 Отправьте ваш номер телефона, чтобы мы могли связаться:",
        reply_markup=_phone_keyboard(),
    )


@router.message(LeadStates.waiting_for_phone, F.contact)
async def handle_phone_contact(message: Message, state: FSMContext) -> None:
    """Handle phone sent via contact button."""
    contact: Contact = message.contact
    if contact.user_id != message.from_user.id:
        await message.answer("Пожалуйста, отправьте свой собственный номер.")
        return
    phone = _normalize_phone(contact.phone_number)
    await state.update_data(phone=phone)

    # Save phone to user profile too
    async with AsyncSessionLocal() as session:
        from models import User
        user = await session.get(User, message.from_user.id)
        if user and not user.phone:
            user.phone = phone
            await session.commit()

    await state.set_state(LeadStates.waiting_for_comment)
    await message.answer(
        "Есть что добавить? (или нажмите «Пропустить»)",
        reply_markup=_skip_keyboard(),
    )


@router.message(LeadStates.waiting_for_phone)
async def handle_phone_text(message: Message, state: FSMContext) -> None:
    """Handle phone typed as text."""
    raw = (message.text or "").strip()
    digits = "".join(c for c in raw if c.isdigit() or c == "+")
    if len(digits) < 10:
        await message.answer(
            "Не похоже на номер телефона. Нажмите кнопку «📱 Отправить номер» или введите вручную:",
            reply_markup=_phone_keyboard(),
        )
        return
    phone = _normalize_phone(raw)
    await state.update_data(phone=phone)
    await state.set_state(LeadStates.waiting_for_comment)
    await message.answer(
        "Есть что добавить? (или нажмите «Пропустить»)",
        reply_markup=_skip_keyboard(),
    )


@router.message(LeadStates.waiting_for_comment)
async def handle_comment(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    comment = None if text == "⏭ Пропустить" else text

    data = await state.get_data()
    await state.clear()

    child_name = data.get("child_name", "")
    child_age = data.get("child_age", "")
    interest = data.get("interest", "")
    phone = data.get("phone", "")

    # Save to DB
    async with AsyncSessionLocal() as session:
        lead = Lead(
            tg_user_id=message.from_user.id,
            child_name=child_name,
            child_age=child_age,
            interest=interest,
            comment=comment,
        )
        session.add(lead)
        await session.commit()

    # Reply to user
    from handlers.games import main_keyboard
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    await message.answer(
        "✅ Заявка принята!\n\nМы свяжемся с вами в ближайшее время.",
        reply_markup=main_keyboard(bool(user.phone)),
    )

    # Notify admin
    username = message.from_user.username
    user_link = f"@{username}" if username else f"tg://user?id={message.from_user.id}"
    full_name = message.from_user.full_name or "—"
    text_parts = [
        "📝 <b>Новая заявка на пробное</b>\n",
        f"👤 Родитель: {full_name} ({user_link})",
        f"👶 Ребёнок: {child_name}, {child_age} лет",
        f"🎯 Направление: {interest}",
        f"📱 Телефон: {phone}",
    ]
    if comment:
        text_parts.append(f"💬 Комментарий: {comment}")
    await notify_admin(message.bot, "\n".join(text_parts))

    # Send to AlfaCRM (if configured)
    try:
        if settings.alfacrm_domain and settings.alfacrm_token:
            from crm import create_lead as crm_create_lead
            note = f"Возраст: {child_age}, Направление: {interest}"
            if comment:
                note += f", Комментарий: {comment}"
            crm_create_lead(
                branch_id=settings.alfacrm_branch_id,
                name=child_name,
                phone=phone,
                note=note,
            )
            logger.info("Lead sent to AlfaCRM for %s", child_name)
    except Exception as e:
        logger.warning("CRM lead creation failed: %s", e)


def _normalize_phone(phone: str) -> str:
    """Normalize phone number to +7... format."""
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    if not digits.startswith("+"):
        digits = "+" + digits
    return digits
