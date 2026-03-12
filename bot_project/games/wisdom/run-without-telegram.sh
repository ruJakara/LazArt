#!/bin/bash

echo "============================================================"
echo "  Night Hunger: Vampire Evo - Запуск без Telegram бота"
echo "============================================================"
echo ""

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    echo "[!] Файл .env не найден. Копируем из .env.example..."
    cp .env.example .env
    echo ""
    echo "[!] Отредактируйте .env и установите:"
    echo "    - JWT_SECRET=ваш_секретный_ключ"
    echo "    - DATABASE_URL=postgresql://postgres:password@localhost:5432/night_hunger"
    echo "    - REDIS_URL=redis://localhost:6379"
    echo ""
    read -p "Нажмите Enter для продолжения..."
fi

echo "[1/4] Проверка зависимостей..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js не найден. Установите Node.js 18+"
    echo "https://nodejs.org/"
    exit 1
fi

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm не найден"
    exit 1
fi

echo "[OK] Node.js: $(node --version)"
echo "[OK] npm: $(npm --version)"

echo ""
echo "[2/4] Установка зависимостей..."

# Установка зависимостей в корне
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Установка зависимостей в API
if [ -f "services/api/package.json" ]; then
    echo "Installing API dependencies..."
    cd services/api && npm install && cd ../..
fi

# Установка зависимостей в Web
if [ -f "apps/web/package.json" ]; then
    echo "Installing Web dependencies..."
    cd apps/web && npm install && cd ../..
fi

# Установка зависимостей в Worker
if [ -f "services/worker/package.json" ]; then
    echo "Installing Worker dependencies..."
    cd services/worker && npm install && cd ../..
fi

echo ""
echo "[3/4] Проверка переменных окружения..."

# Проверка JWT_SECRET
if ! grep -q "JWT_SECRET=" .env; then
    echo "[WARNING] JWT_SECRET не установлен в .env"
    echo "Добавляем JWT_SECRET=dev_secret_key_12345"
    echo "JWT_SECRET=dev_secret_key_12345" >> .env
fi

echo ""
echo "[4/4] Запуск сервисов..."
echo ""
echo "============================================================"
echo "  Сервисы для запуска:"
echo "  - API (NestJS): http://localhost:3000"
echo "  - Frontend (React): http://localhost:5173"
echo "  - Worker (фоновые задачи)"
echo ""
echo "  Telegram бот НЕ запускается"
echo "============================================================"
echo ""
echo "[i] Для остановки нажмите Ctrl+C"
echo ""

# Запуск API
echo "[>] Запуск API..."
cd services/api
npm run dev &
API_PID=$!
cd ../..

# Запуск Frontend
echo "[>] Запуск Frontend..."
cd apps/web
npm run dev &
WEB_PID=$!
cd ../..

# Запуск Worker
echo "[>] Запуск Worker..."
cd services/worker
npm run dev &
WORKER_PID=$!
cd ../..

echo ""
echo "[OK] Все сервисы запущены!"
echo ""
echo "Доступ:"
echo "  - Frontend: http://localhost:5173"
echo "  - API: http://localhost:3000/api/health"
echo ""
echo "[i] Для остановки нажмите Ctrl+C"
echo ""

# Ожидание завершения
wait
