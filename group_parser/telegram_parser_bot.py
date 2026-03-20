import asyncio
import json
import os
import sqlite3
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from telegram import LabeledPrice, ReplyKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    PreCheckoutQueryHandler,
    filters,
)


BASE_DIR = Path(__file__).resolve().parent
PARSER_SCRIPT = BASE_DIR / "vk_live_parser.py"
OUTPUT_DIR = BASE_DIR / "bot_output"
DB_FILE = BASE_DIR / "subscriptions.db"
RUN_LOCK = asyncio.Lock()

RUN_BUTTON_TEXT = "Запустить парсинг"
STATUS_BUTTON_TEXT = "Статус подписки"

SUBSCRIPTION_PRICE_RUB = int(os.getenv("SUBSCRIPTION_PRICE_RUB", "300"))
SUBSCRIPTION_DAYS = int(os.getenv("SUBSCRIPTION_DAYS", "30"))
PAYMENT_CURRENCY = os.getenv("PAYMENT_CURRENCY", "RUB").strip().upper() or "RUB"
PAYMENT_PROVIDER_TOKEN = os.getenv("PAYMENT_PROVIDER_TOKEN", "").strip()
SUBSCRIPTION_REQUIRED = os.getenv("SUBSCRIPTION_REQUIRED", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}
INVOICE_START_PARAMETER = os.getenv("INVOICE_START_PARAMETER", "vk-parser-sub")

PAY_BUTTON_TEXT = f"Оплатить {SUBSCRIPTION_PRICE_RUB} ₽ / месяц"


@dataclass
class RunResult:
    return_code: int
    output_file: Path
    stdout: str
    stderr: str


def _parse_user_ids(var_name: str) -> set[int]:
    raw = os.getenv(var_name, "").strip()
    if not raw:
        return set()

    result: set[int] = set()
    for chunk in raw.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        try:
            result.add(int(chunk))
        except ValueError:
            continue
    return result


ALLOWED_USERS = _parse_user_ids("TELEGRAM_ALLOWED_USERS")
ADMIN_USERS = _parse_user_ids("TELEGRAM_ADMIN_USERS")


def _init_db() -> None:
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subscriptions (
                user_id INTEGER PRIMARY KEY,
                paid_until INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL
            )
            """
        )
        conn.commit()


def _is_allowed_user(user_id: int) -> bool:
    if not ALLOWED_USERS:
        return True
    return user_id in ALLOWED_USERS


def _is_admin_user(user_id: int) -> bool:
    return user_id in ADMIN_USERS


def _get_paid_until(user_id: int) -> int:
    with sqlite3.connect(DB_FILE) as conn:
        row = conn.execute(
            "SELECT paid_until FROM subscriptions WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return 0
    return int(row[0] or 0)


def _set_paid_until(user_id: int, paid_until: int) -> None:
    now_ts = int(time.time())
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute(
            """
            INSERT INTO subscriptions (user_id, paid_until, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                paid_until = excluded.paid_until,
                updated_at = excluded.updated_at
            """,
            (user_id, paid_until, now_ts),
        )
        conn.commit()


def _extend_subscription(user_id: int, days: int) -> int:
    now_ts = int(time.time())
    current_until = _get_paid_until(user_id)
    base = max(now_ts, current_until)
    new_until = base + days * 24 * 60 * 60
    _set_paid_until(user_id, new_until)
    return new_until


def _has_access(user_id: int) -> bool:
    if _is_admin_user(user_id):
        return True
    if not SUBSCRIPTION_REQUIRED:
        return True
    return _get_paid_until(user_id) > int(time.time())


def _format_until(ts: int) -> str:
    if ts <= 0:
        return "-"
    return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")


def _remaining_days(ts: int) -> int:
    if ts <= 0:
        return 0
    seconds_left = ts - int(time.time())
    if seconds_left <= 0:
        return 0
    return max(1, seconds_left // (24 * 60 * 60))


def _subscription_status_text(user_id: int) -> str:
    if _is_admin_user(user_id):
        return "Админ-доступ активен без оплаты."

    paid_until = _get_paid_until(user_id)
    if paid_until <= int(time.time()):
        return (
            "Подписка не активна.\n"
            f"Тариф: {SUBSCRIPTION_PRICE_RUB} ₽ / {SUBSCRIPTION_DAYS} дней."
        )

    days = _remaining_days(paid_until)
    return (
        "Подписка активна.\n"
        f"Действует до: {_format_until(paid_until)}\n"
        f"Осталось дней: {days}"
    )


def _build_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [[RUN_BUTTON_TEXT], [PAY_BUTTON_TEXT, STATUS_BUTTON_TEXT]],
        resize_keyboard=True,
    )


def _build_parser_env(output_file: Path) -> dict[str, str]:
    vk_token = os.getenv("VK_TOKEN", "").strip()
    if not vk_token:
        raise RuntimeError("Не задан VK_TOKEN. Установите переменную окружения VK_TOKEN.")

    env = os.environ.copy()
    env["VK_TOKEN"] = vk_token
    env["DISCOVERY_MODE"] = os.getenv("DISCOVERY_MODE", "auto").strip() or "auto"
    env["SEED_FILE"] = os.getenv("SEED_FILE", "seed_groups.txt").strip() or "seed_groups.txt"
    env["OUTPUT_FILE"] = str(output_file)
    env["PYTHONIOENCODING"] = "utf-8"
    return env


def _run_parser_subprocess(chat_id: int) -> RunResult:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = int(time.time())
    output_file = OUTPUT_DIR / f"live_groups_{chat_id}_{stamp}.json"

    timeout_seconds = int(os.getenv("PARSER_TIMEOUT_SECONDS", "900"))
    env = _build_parser_env(output_file)

    completed = subprocess.run(
        [sys.executable, str(PARSER_SCRIPT)],
        cwd=str(BASE_DIR),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout_seconds,
        check=False,
    )
    return RunResult(
        return_code=completed.returncode,
        output_file=output_file,
        stdout=completed.stdout or "",
        stderr=completed.stderr or "",
    )


def _load_groups(file_path: Path) -> list[dict]:
    if not file_path.exists():
        return []
    try:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    return []


def _tail_lines(text: str, max_lines: int = 20) -> str:
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return "(лог пуст)"
    return "\n".join(lines[-max_lines:])


def _build_summary(groups: list[dict], max_items: int = 10) -> str:
    if not groups:
        return "Живые группы не найдены."

    lines: list[str] = []
    for group in groups[:max_items]:
        name = str(group.get("name", "")).strip() or "Без названия"
        screen_name = str(group.get("screen_name", "")).strip() or f"club{group.get('id', '')}"
        members = int(group.get("members_count", 0))
        lines.append(f"- {name} (vk.com/{screen_name}, {members} чел)")

    if len(groups) > max_items:
        lines.append(f"- ... и еще {len(groups) - max_items}")

    return "\n".join(lines)


async def _send_invoice(chat_id: int, user_id: int, context: ContextTypes.DEFAULT_TYPE) -> None:
    payload = f"sub:{user_id}:{int(time.time())}"
    prices = [LabeledPrice(label=f"Доступ на {SUBSCRIPTION_DAYS} дней", amount=SUBSCRIPTION_PRICE_RUB * 100)]

    await context.bot.send_invoice(
        chat_id=chat_id,
        title="Подписка на VK Group Parser",
        description=(
            f"Доступ к парсингу живых групп VK на {SUBSCRIPTION_DAYS} дней."
        ),
        payload=payload,
        provider_token=PAYMENT_PROVIDER_TOKEN,
        currency=PAYMENT_CURRENCY,
        prices=prices,
        start_parameter=INVOICE_START_PARAMETER,
        need_name=False,
        need_phone_number=False,
        need_email=False,
    )


async def _send_main_menu(update: Update, user_id: int) -> None:
    await update.effective_message.reply_text(
        "Нажмите кнопку для запуска парсинга.\n\n"
        f"{_subscription_status_text(user_id)}",
        reply_markup=_build_menu_keyboard(),
    )


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user:
        return

    if not _is_allowed_user(user.id):
        await update.effective_message.reply_text("Доступ к боту ограничен.")
        return

    await _send_main_menu(update, user.id)


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "/start - показать меню\n"
        "/parse - запустить парсинг\n"
        "/pay - оплатить подписку\n"
        "/status - статус подписки"
    )


async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user:
        return
    if not _is_allowed_user(user.id):
        await update.effective_message.reply_text("Доступ к боту ограничен.")
        return
    await update.effective_message.reply_text(_subscription_status_text(user.id))


async def pay_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat = update.effective_chat
    message = update.effective_message
    if not user or not chat or not message:
        return

    if not _is_allowed_user(user.id):
        await message.reply_text("Доступ к боту ограничен.")
        return

    if _is_admin_user(user.id):
        await message.reply_text("У вас админ-доступ, оплата не требуется.")
        return

    if not SUBSCRIPTION_REQUIRED:
        await message.reply_text("Подписка отключена в конфиге, доступ открыт.")
        return

    if _has_access(user.id):
        await message.reply_text(
            "Подписка уже активна.\n" + _subscription_status_text(user.id)
        )
        return

    await _send_invoice(chat.id, user.id, context)


async def _run_parse_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat = update.effective_chat
    message = update.effective_message
    if not user or not chat or not message:
        return

    if not _is_allowed_user(user.id):
        await message.reply_text("Доступ к боту ограничен.")
        return

    if not _has_access(user.id):
        await message.reply_text(
            "Доступ к парсингу по подписке.\n"
            f"Тариф: {SUBSCRIPTION_PRICE_RUB} ₽ / {SUBSCRIPTION_DAYS} дней."
        )
        await _send_invoice(chat.id, user.id, context)
        return

    if RUN_LOCK.locked():
        await message.reply_text("Парсинг уже выполняется. Подождите завершения.")
        return

    async with RUN_LOCK:
        await message.reply_text("Запустил парсинг. Это может занять 10-60 секунд.")
        try:
            result = await asyncio.to_thread(_run_parser_subprocess, chat.id)
        except subprocess.TimeoutExpired:
            await message.reply_text("Парсинг превысил лимит времени и был остановлен.")
            return
        except Exception as exc:  # noqa: BLE001
            await message.reply_text(f"Ошибка запуска: {exc}")
            return

        if result.return_code != 0:
            logs = _tail_lines(result.stdout + "\n" + result.stderr)
            await message.reply_text(
                "Парсер завершился с ошибкой.\n\n"
                f"Последние строки лога:\n{logs}"
            )
            return

        groups = _load_groups(result.output_file)
        summary = _build_summary(groups)
        await message.reply_text(
            f"Готово. Найдено живых групп: {len(groups)}\n\n{summary}"
        )

        if result.output_file.exists():
            with result.output_file.open("rb") as doc:
                await context.bot.send_document(
                    chat_id=chat.id,
                    document=doc,
                    filename="live_groups.json",
                    caption="Файл с результатами парсинга",
                )


async def parse_command_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _run_parse_flow(update, context)


async def run_button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    text = (message.text or "").strip()
    if not text:
        return

    if text.lower() == RUN_BUTTON_TEXT.lower():
        await _run_parse_flow(update, context)
        return
    if text.lower() == PAY_BUTTON_TEXT.lower():
        await pay_handler(update, context)
        return
    if text.lower() == STATUS_BUTTON_TEXT.lower():
        await status_handler(update, context)
        return


async def precheckout_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.pre_checkout_query
    if not query:
        return

    if not query.invoice_payload.startswith("sub:"):
        await query.answer(
            ok=False,
            error_message="Некорректный платеж. Попробуйте заново.",
        )
        return

    await query.answer(ok=True)


async def successful_payment_handler(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user = update.effective_user
    message = update.effective_message
    if not user or not message or not message.successful_payment:
        return

    payment = message.successful_payment
    if not payment.invoice_payload.startswith("sub:"):
        await message.reply_text("Платеж получен, но payload не распознан.")
        return

    expected_amount = SUBSCRIPTION_PRICE_RUB * 100
    if payment.currency != PAYMENT_CURRENCY or payment.total_amount < expected_amount:
        await message.reply_text(
            "Платеж получен, но параметры не совпадают с тарифом. Обратитесь в поддержку."
        )
        return

    new_until = _extend_subscription(user.id, SUBSCRIPTION_DAYS)
    await message.reply_text(
        "Оплата прошла успешно.\n"
        f"Доступ активирован до: {_format_until(new_until)}",
        reply_markup=_build_menu_keyboard(),
    )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    print(f"Telegram bot error: {context.error}")


def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise SystemExit(
            "Не задан TELEGRAM_BOT_TOKEN. Установите токен бота в переменную окружения."
        )
    if not PARSER_SCRIPT.exists():
        raise SystemExit(f"Не найден файл парсера: {PARSER_SCRIPT}")
    if SUBSCRIPTION_REQUIRED and not PAYMENT_PROVIDER_TOKEN:
        raise SystemExit(
            "Не задан PAYMENT_PROVIDER_TOKEN. Укажите токен платежного провайдера."
        )

    _init_db()

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("parse", parse_command_handler))
    app.add_handler(CommandHandler("pay", pay_handler))
    app.add_handler(CommandHandler("status", status_handler))
    app.add_handler(PreCheckoutQueryHandler(precheckout_handler))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, run_button_handler))
    app.add_error_handler(error_handler)
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
