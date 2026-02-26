# ==============================================================================
# LOCALIZATION / ЛОКАЛИЗАЦИЯ
# ==============================================================================
# RU/EN language strings for the bot

TEXTS = {
    "ru": {
        # Welcome & Auth
        "welcome_title": "🛡 <b>Система мониторинга аварий</b>",
        "welcome_desc": "📡 Автоматический сбор новостей\n🤖 AI-анализ релевантности\n⚡ Мгновенные уведомления",
        "welcome_continue": "▶️ Продолжить",
        "enter_password": "🔐 Введите пароль для доступа:",
        "auth_success": "✅ <b>Авторизация успешна!</b>",
        "auth_failed": "❌ Неверный пароль.",
        "already_auth": "ℹ️ Вы уже авторизованы.",
        
        # Progress
        "progress_wait": "⏳ <b>Подождите...</b>",
        "progress_collecting": "🔍 Сбор новостей",
        "progress_analyzing": "🤖 AI-анализ",
        "progress_done": "✅ Готово",
        "progress_time": "⚠️ Первичная проверка займёт 2-3 минуты",
        
        # Check results
        "check_complete": "✅ <b>Проверка завершена!</b>",
        "first_check_complete": "🎉 <b>Первичная проверка завершена!</b>",
        "collected": "📥 Собрано",
        "processed": "🤖 Обработано",
        "relevant": "🎯 Релевантных",
        "signals": "📤 Сигналов",
        "events_found": "🎉 Новые события найдены!",
        "no_events": "ℹ️ Релевантных событий нет.",
        "system_ready": "✅ Система готова к работе!",
        "auto_check": "⏱ Автопроверка каждые 30 минут.",
        "choose_action": "⬇️ Выберите действие:",
        
        # Main menu
        "main_menu": "🏠 <b>Главное меню</b>",
        "stats": "📊 Статистика",
        "check": "🔄 Проверить",
        "settings": "⚙️ Настройки",
        "sources": "📋 Источники",
        "help": "ℹ️ Справка",
        "author": "👤 Автор",
        "back": "⬅️ Назад",
        
        # Stats
        "stats_title": "📊 <b>Статистика</b>",
        "total_articles": "📰 Всего статей",
        "processed_articles": "✅ Обработано",
        "in_queue": "⏳ В очереди",
        "filtered_events": "🎯 Релевантных",
        "sent_signals": "📤 Сигналов",
        
        # Settings
        "settings_title": "⚙️ <b>Настройки</b>",
        "notifications": "🔔 Уведомления",
        "threshold_medium": "📈 Порог: Средний",
        "threshold_high": "📊 Порог: Высокий",
        "change_password": "🔑 Сменить пароль",
        "language": "🌐 Язык",
        
        # Help
        "help_title": "📚 <b>Справка</b>",
        "help_commands": """<b>🎛 Основные функции:</b>
▪️ <b>/start</b> — Главное меню
▪️ <b>/check</b> — Запустить проверку вручную
▪️ <b>/settings</b> — Настройки бота:
  • 🔇 <b>Шум:</b> Настройка важности (Все / Стандарт / Важное)
  • ⏸ <b>Пауза:</b> Приостановка уведомлений на 24ч
  • 🔔 <b>Уведомления:</b> Вкл/Выкл
  • 🇷🇺/🇬🇧 <b>Язык:</b> Смена языка

<b>🤖 Как это работает:</b>
Бот мониторит 100+ источников каждые 30 минут. AI анализирует новости и фильтрует их по срочности (1-5).
  • <b>Urgency 5:</b> Критические аварии/ЧП
  • <b>Urgency 3-4:</b> Значимые инциденты/Ремонты
  • <b>Urgency 1-2:</b> Мелкие события (скрыты в режиме "Стандарт")

<b>👍 Обратная связь:</b>
Используйте кнопки под сигналами, чтобы обучать бота!""",
        "help_auto": "⏱ Автопроверка: каждые 30 мин.",
        
        # Sources
        "sources_title": "📡 <b>Источники</b>",
        "sources_federal": "🏢 Федеральные СМИ",
        "sources_yandex": "📰 Яндекс Новости",
        "sources_mchs": "🚒 МЧС России",
        "sources_industry": "🏭 Отраслевые порталы",
        "sources_regional": "🏘 Региональные СМИ",
        "sources_total": "📊 Всего: <b>100+</b> источников",
        
        # Author
        "author_title": "👨‍💻 <b>Автор проекта</b>",
        "author_dev": "💬 Разработчик: @SalutByBase",
        "author_desc": "🛠 Система мониторинга аварий для определения потребности в насосном оборудовании.",
        "author_coffee": "☕ <i>Автор не отказался бы от чая... хотя любит кофе ☕</i>",
        
        # Scan
        "scan_started": "🔍 <b>Сканирование запущено</b>",
        "scan_connecting": "📡 Подключение к источникам...",
        "scan_parallel": "⚡ Параллельная обработка (20 потоков)",
        "scan_ai": "🤖 AI: Sonar Large 128K",
        "scan_wait": "⏳ <i>Ожидайте 2-3 минуты</i>",
        
        # Wizard
        "wizard_start": "🛠 <b>Мастер настройки</b>\n\nДавайте настроим бота под ваши задачи за 3 шага.",
        "wizard_quick": "🚀 Быстрый старт (все настройки по умолчанию)",
        "wizard_custom": "🛠 Настроить вручную",
        "wizard_step_1": "1️⃣ <b>Выберите регион:</b>",
        "wizard_region_fed": "🇷🇺 Только Федеральные (РФ)",
        "wizard_region_moscow": "🏙 Москва и область",
        "wizard_region_all": "🌍 Все регионы (максимум)",
        "wizard_step_2": "2️⃣ <b>Что отслеживать?</b>",
        "wizard_focus_accidents": "🔥 Только аварии (критично)",
        "wizard_focus_repairs": "🛠 Аварии + Ремонты",
        "wizard_focus_all": "📋 Всё (включая плановые)",
        "wizard_step_3": "3️⃣ <b>Уровень шума:</b>",
        "wizard_noise_low": "🔇 Только важные (Urgency 4-5)",
        "wizard_noise_med": "🔉 Стандарт (Urgency 3-5)",
        "wizard_noise_high": "🔊 Все события (Urgency 1-5)",
        "wizard_complete": "✅ <b>Настройка завершена!</b>\n\nВаш профиль сохранён.",
        "wizard_skip": "⏩ Пропустить",
        
        # Scan Status
        "scan_started": "📡 <b>Инициализация сканирования...</b>",
        "scan_connecting": "🌐 Подключение к 100+ источникам...",
        "scan_parallel": "⚡ Параллельная обработка данных...",
        "scan_ai": "🤖 AI-анализ контента (Sonar Large 128K)...",
        "scan_wait": "⏳ <i>Это займёт 2-3 минуты. Мы отбираем только самое важное.</i>",
    },
    
    "en": {
        # Welcome & Auth
        "welcome_title": "🛡 <b>Accident Monitoring System</b>",
        "welcome_desc": "📡 Automatic news collection\n🤖 AI relevance analysis\n⚡ Instant notifications",
        "welcome_continue": "▶️ Continue",
        "enter_password": "🔐 Enter password:",
        "auth_success": "✅ <b>Authorization successful!</b>",
        "auth_failed": "❌ Wrong password.",
        "already_auth": "ℹ️ You are already authorized.",
        
        # Progress
        "progress_wait": "⏳ <b>Please wait...</b>",
        "progress_collecting": "🔍 Collecting news",
        "progress_analyzing": "🤖 AI analysis",
        "progress_done": "✅ Done",
        "progress_time": "⚠️ Initial check will take 2-3 minutes",
        
        # Check results
        "check_complete": "✅ <b>Check complete!</b>",
        "first_check_complete": "🎉 <b>Initial check complete!</b>",
        "collected": "📥 Collected",
        "processed": "🤖 Processed",
        "relevant": "🎯 Relevant",
        "signals": "📤 Signals",
        "events_found": "🎉 New events found!",
        "no_events": "ℹ️ No relevant events.",
        "system_ready": "✅ System is ready!",
        "auto_check": "⏱ Auto-check every 30 minutes.",
        "choose_action": "⬇️ Choose action:",
        
        # Main menu
        "main_menu": "🏠 <b>Main Menu</b>",
        "stats": "📊 Statistics",
        "check": "🔄 Check",
        "settings": "⚙️ Settings",
        "sources": "📋 Sources",
        "help": "ℹ️ Help",
        "author": "👤 Author",
        "back": "⬅️ Back",
        
        # Stats
        "stats_title": "📊 <b>Statistics</b>",
        "total_articles": "📰 Total articles",
        "processed_articles": "✅ Processed",
        "in_queue": "⏳ In queue",
        "filtered_events": "🎯 Relevant",
        "sent_signals": "📤 Signals",
        
        # Settings
        "settings_title": "⚙️ <b>Settings</b>",
        "notifications": "🔔 Notifications",
        "threshold_medium": "📈 Threshold: Medium",
        "threshold_high": "📊 Threshold: High",
        "change_password": "🔑 Change password",
        "language": "🌐 Language",
        
        # Help
        "help_title": "📚 <b>Help</b>",
        "help_commands": "<b>🎛 Commands:</b>",
        "help_auto": "⏱ System runs automatically every 30 minutes.",
        
        # Sources
        "sources_title": "📡 <b>Sources</b>",
        "sources_federal": "🏢 Federal Media",
        "sources_yandex": "📰 Yandex News",
        "sources_mchs": "🚒 EMERCOM Russia",
        "sources_industry": "🏭 Industry portals",
        "sources_regional": "🏘 Regional Media",
        "sources_total": "📊 Total: <b>100+</b> sources",
        
        # Author
        "author_title": "👨‍💻 <b>Project Author</b>",
        "author_dev": "💬 Developer: @SalutByBase",
        "author_desc": "🛠 Accident monitoring system for pump equipment needs.",
        "author_coffee": "☕ <i>Author wouldn't mind some tea... though prefers coffee ☕</i>",
        
        # Scan
        "scan_started": "📡 <b>Initializing scan...</b>",
        "scan_connecting": "🌐 Connecting to 100+ sources...",
        "scan_parallel": "⚡ Parallel data processing...",
        "scan_ai": "🤖 AI Content Analysis (Sonar Large 128K)...",
        "scan_wait": "⏳ <i>This will take 2-3 minutes. We curate only the most critical events.</i>",
        
        # Wizard
        "wizard_start": "🛠 <b>Setup Wizard</b>\n\nLet's configure the bot in 3 steps.",
        "wizard_quick": "🚀 Quick Start (Default settings)",
        "wizard_custom": "🛠 Custom Setup",
        "wizard_step_1": "1️⃣ <b>Select Region:</b>",
        "wizard_region_fed": "🇷🇺 Federal Only",
        "wizard_region_moscow": "🏙 Moscow Region",
        "wizard_region_all": "🌍 All Regions",
        "wizard_step_2": "2️⃣ <b>What to track?</b>",
        "wizard_focus_accidents": "🔥 Accidents Only (Critical)",
        "wizard_focus_repairs": "🛠 Accidents + Repairs",
        "wizard_focus_all": "📋 Everything",
        "wizard_step_3": "3️⃣ <b>Noise Level:</b>",
        "wizard_noise_low": "🔇 Vital Only (Urgency 4-5)",
        "wizard_noise_med": "🔉 Standard (Urgency 3-5)",
        "wizard_noise_high": "🔊 All Events (Urgency 1-5)",
        "wizard_complete": "✅ <b>Setup Complete!</b>\n\nProfile saved.",
        "wizard_skip": "⏩ Skip",
    }
}


def get_text(key: str, lang: str = "ru") -> str:
    """Get localized text by key"""
    return TEXTS.get(lang, TEXTS["ru"]).get(key, key)
