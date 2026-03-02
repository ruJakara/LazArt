from __future__ import annotations

import json
import uuid
from typing import Dict, List, Optional
from urllib.parse import quote

from aiogram import Bot, F, Router
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)
from sqlalchemy import desc, select

from config import get_settings
from core.events import track
from models import AsyncSessionLocal, GameResult, User, get_or_create_user

router = Router(name="games")
settings = get_settings()


# ---------------------------------------------------------------------------
# Keyboards
# ---------------------------------------------------------------------------

def main_keyboard(is_known: bool = False) -> ReplyKeyboardMarkup:
    """Main menu. Known users get an extra '🏆 Мой результат' button."""
    rows = [
        [KeyboardButton(text="🎮 Играть")],
        [KeyboardButton(text="📝 Записаться / пробное")],
        [KeyboardButton(text="💳 Ожидаю счёт")],
        [KeyboardButton(text="📩 Написать админу")],
    ]
    if is_known:
        rows.append([KeyboardButton(text="🏆 Мой результат")])
    rows.append([KeyboardButton(text="👑 Хочу такого же бота")])
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True)


def after_game_keyboard() -> InlineKeyboardMarkup:
    """Buttons shown after a game result."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🔥 Бросить вызов другу", callback_data="challenge_friend")],
            [InlineKeyboardButton(text="🎯 Сыграть ещё", callback_data="play_again")],
            [InlineKeyboardButton(text="🧭 В меню Царя", callback_data="go_menu")],
        ]
    )


def games_keyboard(games: List[Dict]) -> InlineKeyboardMarkup:
    buttons: List[List[InlineKeyboardButton]] = []
    for game in games:
        if game.get("enabled"):
            buttons.append(
                [InlineKeyboardButton(text=game["name"], callback_data=f"game_{game['id']}")]
            )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def play_game_keyboard(game_id: str, session_id: str) -> InlineKeyboardMarkup:
    base = settings.webapp_base_url
    # Ensure base URL has a protocol
    if not base.startswith("http://") and not base.startswith("https://"):
        base = f"https://{base}"
    base = base.rstrip("/")
    game_path = settings.game_paths.get(game_id)
    if not game_path:
        url = f"{base}/"
    else:
        safe_path = quote(game_path, safe="/")
        url = f"{base}/{safe_path}?gameid={game_id}&sessionid={session_id}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎮 Запустить игру", web_app=WebAppInfo(url=url))]
        ]
    )


def load_games() -> List[Dict]:
    try:
        with open("games.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


# ---------------------------------------------------------------------------
# /start
# ---------------------------------------------------------------------------

@router.message(Command("start"))
async def cmd_start(message: Message) -> None:
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    is_known = bool(user.phone)

    await track("user.started", message.from_user.id, {
        "username": message.from_user.username,
        "start_param": message.text.split(maxsplit=1)[1] if len(message.text.split()) > 1 else None,
    })

    # Show greeting + game button
    games = load_games()
    enabled = [g for g in games if g.get("enabled")]

    # Всегда показываем reply-клавиатуру (меню)
    await message.answer(
        "👋 Привет! Я бот школы LazArt.\n\nВыбери действие в меню ⬇️",
        reply_markup=main_keyboard(is_known),
    )

    if enabled:
        first_game = enabled[0]
        session_id = str(uuid.uuid4())
        await message.answer(
            "А для начала — сыграй 60 секунд! 🎮",
            reply_markup=play_game_keyboard(first_game["id"], session_id),
        )
        await track("game.opened", message.from_user.id, {
            "game_id": first_game["id"],
            "session_id": session_id,
            "source": "start",
        })


# ---------------------------------------------------------------------------
# /menu
# ---------------------------------------------------------------------------

@router.message(Command("menu"))
async def cmd_menu(message: Message) -> None:
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    await message.answer(
        "🧭 Главное меню:",
        reply_markup=main_keyboard(bool(user.phone)),
    )


# ---------------------------------------------------------------------------
# 🎮 Играть
# ---------------------------------------------------------------------------

@router.message(F.text == "🎮 Играть")
async def show_games_to_play(message: Message) -> None:
    games = load_games()
    enabled_games = [g for g in games if g.get("enabled")]
    if not enabled_games:
        user = await get_or_create_user(message.from_user.id, message.from_user.username)
        await message.answer("Пока нет доступных игр.", reply_markup=main_keyboard(bool(user.phone)))
        return
    await message.answer("Выбери игру:", reply_markup=games_keyboard(enabled_games))


@router.callback_query(F.data.startswith("game_"))
async def select_game(callback: CallbackQuery) -> None:
    game_id = callback.data.replace("game_", "")
    games = load_games()
    game = next((g for g in games if g["id"] == game_id), None)
    if not game:
        await callback.answer("Игра не найдена")
        return
    if game_id not in settings.game_paths:
        await callback.answer("Путь к игре не настроен")
        return

    session_id = str(uuid.uuid4())
    await callback.message.answer(
        f"🎮 {game['name']}\n\nНажми кнопку ниже, чтобы начать игру.",
        reply_markup=play_game_keyboard(game_id, session_id),
    )
    await track("game.opened", callback.from_user.id, {
        "game_id": game_id,
        "session_id": session_id,
        "source": "menu",
    })
    await callback.answer()


# ---------------------------------------------------------------------------
# WebApp result handler
# ---------------------------------------------------------------------------

@router.message(F.web_app_data)
async def handle_web_app_data(message: Message) -> None:
    try:
        data = json.loads(message.web_app_data.data)
    except Exception:
        await message.answer("Не удалось прочитать результат игры.")
        return

    game_id = data.get("game_id", "unknown")
    score = int(data.get("score", 0))
    raw_payload = message.web_app_data.data

    await track("game.finished", message.from_user.id, {
        "game_id": game_id,
        "score": score,
        "raw_payload": raw_payload,
    })

    # Save to game_results
    user = await get_or_create_user(message.from_user.id, message.from_user.username)
    async with AsyncSessionLocal() as session:
        result_row = GameResult(
            tg_user_id=message.from_user.id,
            game_id=game_id,
            score=score,
            raw_payload=raw_payload,
        )
        session.add(result_row)
        await session.commit()

    await message.answer(
        f"🏆 Игра завершена!\n\n"
        f"🎮 Игра: {game_id}\n"
        f"⭐ Очки: {score}",
        reply_markup=after_game_keyboard(),
    )


@router.callback_query(F.data == "play_again")
async def play_again(callback: CallbackQuery) -> None:
    games = load_games()
    enabled = [g for g in games if g.get("enabled")]
    if not enabled:
        await callback.answer("Нет доступных игр")
        return
    await callback.message.answer("Выбери игру:", reply_markup=games_keyboard(enabled))
    await callback.answer()


@router.callback_query(F.data == "go_menu")
async def go_menu(callback: CallbackQuery) -> None:
    user = await get_or_create_user(callback.from_user.id, callback.from_user.username)
    await callback.message.answer(
        "🧭 Главное меню:",
        reply_markup=main_keyboard(bool(user.phone)),
    )
    await callback.answer()


@router.callback_query(F.data == "challenge_friend")
async def challenge_friend(callback: CallbackQuery) -> None:
    await callback.answer("Функция «Бросить вызов другу» скоро появится! 🔥", show_alert=True)


# ---------------------------------------------------------------------------
# 🏆 Мой результат
# ---------------------------------------------------------------------------

@router.message(F.text == "🏆 Мой результат")
async def my_result(message: Message) -> None:
    async with AsyncSessionLocal() as session:
        stmt = (
            select(GameResult)
            .where(GameResult.tg_user_id == message.from_user.id)
            .order_by(desc(GameResult.score))
            .limit(5)
        )
        result = await session.execute(stmt)
        rows = result.scalars().all()

    user = await get_or_create_user(message.from_user.id, message.from_user.username)

    if not rows:
        await message.answer(
            "У тебя пока нет результатов. Сыграй! 🎮",
            reply_markup=main_keyboard(bool(user.phone)),
        )
        return

    lines = ["🏆 Твои лучшие результаты:"]
    for i, r in enumerate(rows, 1):
        lines.append(f"{i}. {r.game_id} — {r.score} очков")

    await message.answer("\n".join(lines), reply_markup=main_keyboard(bool(user.phone)))
