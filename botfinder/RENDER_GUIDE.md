# 🚀 Render.com Deployment Guide

## Шаг 1: Подготовка репозитория

1. Создай репозиторий на GitHub
2. Загрузи все файлы проекта:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Шаг 2: Настройка Render.com

1. Зайди на [render.com](https://render.com) и зарегистрируйся
2. Нажми **New +** → **Background Worker**
3. Подключи GitHub репозиторий

## Шаг 3: Конфигурация сервиса

### Build Settings:
- **Name:** news-bot (или любое)
- **Region:** Frankfurt (EU) или ближайший
- **Branch:** main
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main.py`

### Environment Variables:

Добавь переменные окружения (нажми **Add Environment Variable**):

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | Твой токен от @BotFather |
| `PERPLEXITY_API_KEY` | API ключ Perplexity |
| `BOT_PASSWORD` | Пароль для входа (например: 1) |

## Шаг 4: Обновление secrets.py

Измени `secrets.py` чтобы читать переменные окружения:

```python
import os

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "твой_токен")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "твой_ключ")
BOT_PASSWORD = os.getenv("BOT_PASSWORD", "1")

# Остальные настройки оставь как есть
PERPLEXITY_API_BASE = "https://api.perplexity.ai"
PERPLEXITY_MODEL = "sonar"
CHECK_INTERVAL_MINUTES = 30
MAX_ARTICLES_PER_CHECK = 50
RELEVANCE_THRESHOLD = 0.6
LOG_LEVEL = "INFO"
LOG_FILE = "bot.log"
DB_PATH = "news_bot.db"

KEYWORDS = [
    "авария", "прорыв", "затопление", "насос", "водоснабжение",
    "канализация", "ЖКХ", "коммунальная авария", "отключение воды",
    "порыв трубы", "утечка", "водопровод", "дренаж", "откачка"
]
```

## Шаг 5: Деплой

1. Нажми **Create Background Worker**
2. Дождись сборки (2-3 минуты)
3. Проверь логи на вкладке **Logs**

## ⚠️ Важно!

- **Тип сервиса:** Background Worker (НЕ Web Service!)
- **База данных:** SQLite файл будет храниться локально, при рестарте сбросится
- **Картинка:** `img.png` должна быть в репозитории

## 🔧 Troubleshooting

### Бот не запускается
- Проверь логи в Render Dashboard
- Убедись что все переменные окружения заданы

### Ошибка импорта
- Проверь `requirements.txt`
- Убедись что версия Python 3.11+

### Бот падает
- Смотри логи: Render Dashboard → Logs
- Проверь токен Telegram и API ключ Perplexity

## 📁 Структура проекта

```
BOT/
├── main.py           # Точка входа
├── telegram_bot.py   # Telegram бот
├── config.py         # Конфигурация
├── secrets.py        # API ключи
├── database.py       # База данных
├── news_collector.py # Сбор новостей
├── ai_filter.py      # AI фильтрация
├── models.py         # Модели данных
├── localization.py   # Локализация RU/EN
├── utils.py          # Утилиты
├── img.png           # Картинка приветствия
├── requirements.txt  # Зависимости
├── runtime.txt       # Версия Python
├── Procfile          # Команда запуска
└── RENDER_GUIDE.md   # Этот файл
```

## ✅ После деплоя

1. Открой Telegram бота
2. Отправь `/start`
3. Выбери язык, нажми "Продолжить"
4. Введи пароль
5. Готово! 🎉
