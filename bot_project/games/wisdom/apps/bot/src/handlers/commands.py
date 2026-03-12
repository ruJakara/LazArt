from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command, CommandStart
from keyboards import main_keyboard, is_webapp_configured

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    referral_code = None
    if message.text and message.text.startswith("/start "):
        referral_code = message.text.split(" ", 1)[1].strip() or None

    await message.answer(
        "🩸 <b>Night Hunger: Vampire Evo</b>\n\n"
        "Добро пожаловать в мир ночной охоты!\n"
        f"{'Вас пригласил игрок с кодом: ' + referral_code + chr(10) if referral_code else ''}"
        "\n"
        "Нажми кнопку ниже, чтобы начать игру:",
        reply_markup=main_keyboard(),
    )

@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "📖 <b>Помощь</b>\n\n"
        "Доступные команды:\n"
        "/start - Начать игру\n"
        "/hunt - Начать охоту\n"
        "/profile - Мой профиль\n"
        "/leaderboard - Таблица лидеров\n"
        "/referral - Реферальная программа\n"
        "/help - Эта справка"
    )

@router.message(Command("hunt"))
async def cmd_hunt(message: Message):
    await message.answer(
        "⚔️ <b>Охота</b>\n\n"
        "Запусти игру и отправляйся на охоту!",
        reply_markup=main_keyboard()
    )

@router.message(Command("profile"))
async def cmd_profile(message: Message):
    user_id = message.from_user.id
    
    # TODO: Получить профиль игрока с backend
    # async with aiohttp.ClientSession() as session:
    #     async with session.get(f"{API_URL}/user/profile", headers={
    #         "Authorization": f"Bearer {user_id}"
    #     }) as response:
    #         profile = await response.json()
    
    await message.answer(
        f"👤 <b>Профиль</b>\n\n"
        f"ID: <code>{user_id}</code>\n"
        f"Статус: Охотник\n"
        f"\n"
        f"Запусти игру для просмотра полной статистики!",
        reply_markup=main_keyboard()
    )

@router.message(Command("leaderboard"))
async def cmd_leaderboard(message: Message):
    await message.answer(
        "🏆 <b>Таблица лидеров</b>\n\n"
        "Соревнуйся с другими игроками за звание лучшего охотника!\n"
        "Запусти игру чтобы увидеть свой рейтинг.",
        reply_markup=main_keyboard()
    )

@router.message(Command("referral"))
async def cmd_referral(message: Message):
    user_id = message.from_user.id
    
    # TODO: Получить реферальный код с backend
    # async with aiohttp.ClientSession() as session:
    #     async with session.get(f"{API_URL}/referral/code", headers={
    #         "Authorization": f"Bearer {user_id}"
    #     }) as response:
    #         data = await response.json()
    #         code = data.get('code', f'REF{user_id}')
    
    code = f"REF{str(user_id)[-6:]}"
    referral_link = f"https://t.me/{(await message.bot.get_me()).username}?start={code}"
    
    await message.answer(
        "👥 <b>Реферальная программа</b>\n\n"
        f"Ваш реферальный код: <code>{code}</code>\n\n"
        f"Пригласите друзей и получите <b>100 крови</b> за каждого!\n\n"
        f"<b>Ваша ссылка:</b>\n"
        f"<code>{referral_link}</code>\n\n"
        f"Отправьте ссылку друзьям!",
        parse_mode="HTML"
    )

@router.message(F.text == "🎮 Играть")
async def play_button(message: Message):
    if not is_webapp_configured():
        await message.answer(
            "WebApp URL не настроен. Я не открываю внешние сайты по плейсхолдеру.\n"
            "Укажи безопасный TELEGRAM_WEBAPP_URL в .env и перезапусти бота.",
            reply_markup=main_keyboard(),
        )
        return

    await message.answer(
        "Нажми кнопку ниже для запуска игры:",
        reply_markup=main_keyboard()
    )

@router.message(F.text == "🏆 Лидеры")
async def leaderboard_button(message: Message):
    await cmd_leaderboard(message)

@router.message(F.text == "👥 Рефералы")
async def referral_button(message: Message):
    await cmd_referral(message)

@router.message(F.text == "📖 Помощь")
async def help_button(message: Message):
    await cmd_help(message)

@router.message()
async def fallback_message(message: Message):
    await message.answer(
        "Я на связи. Попробуй /start или кнопку «🎮 Играть».",
        reply_markup=main_keyboard(),
    )
