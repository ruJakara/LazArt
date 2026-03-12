# Deployment Guide

## Требования

- Docker и Docker Compose
- Доменное имя для production WebApp
- HTTPS/SSL на хостовом nginx (Telegram WebApp требует публичный `https://` URL)

---

## Local Development

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd night-hunger
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
```

Минимум для локального запуска:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
VITE_API_URL=/api
VITE_APP_BASE_PATH=/
```

### 3. Запуск разработки

```bash
npm run dev --prefix apps/web
npm run build --prefix services/api
```

Доступ:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

---

## Production Deployment

### Архитектура server deploy

`night-hunger` больше не использует GitHub Pages. Теперь production-схема такая:

- docker `web` публикуется только на `127.0.0.1:8080`
- docker `api` публикуется только на `127.0.0.1:3000`
- хостовый nginx принимает внешний трафик и проксирует его на `127.0.0.1:8080`
- `web` контейнер сам проксирует `/api` внутрь docker-сети на сервис `api`

Это позволяет жить рядом с остальными проектами на VPS и не конфликтовать за хостовый `:80`.

### 1. Настройка `.env`

```bash
cp .env.example .env
```

Заполните минимум:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBAPP_URL=https://your-night-hunger-domain.example/
WEB_APP_URL=https://your-night-hunger-domain.example/
FRONTEND_URL=https://your-night-hunger-domain.example/
WEB_BIND_HOST=127.0.0.1
WEB_PORT=8080
API_BIND_HOST=127.0.0.1
API_PORT=3000
VITE_API_URL=/api
VITE_APP_BASE_PATH=/
DATABASE_URL=postgresql://postgres:password@localhost:5432/night_hunger?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_strong_secret
```

### 2. Хостовый nginx

Возьмите шаблон `deploy/nginx/night-hunger.conf.example` и установите его как site-конфиг nginx.

Минимальный пример:

```nginx
server {
  listen 80;
  server_name your-night-hunger-domain.example;

  location / {
    proxy_pass http://127.0.0.1:8080;
  }
}
```

Дальше:

1. Заменить `server_name` на реальный домен
2. Включить сайт в nginx
3. Проверить `nginx -t`
4. Перезагрузить nginx
5. Навесить HTTPS (Let's Encrypt или твой текущий reverse proxy)

### 3. Запуск production stack

```bash
chmod +x deploy-bot.sh
./deploy-bot.sh
```

Или вручную:

```bash
docker-compose --env-file .env -f docker/docker-compose.prod.yml up -d --build
docker-compose --env-file .env -f docker/docker-compose.prod.yml ps
```

### 4. Проверка

```bash
docker-compose --env-file .env -f docker/docker-compose.prod.yml logs -f bot
docker-compose --env-file .env -f docker/docker-compose.prod.yml logs -f web
docker-compose --env-file .env -f docker/docker-compose.prod.yml logs -f api
curl http://127.0.0.1:3000/api/health
```

---

## Windows helper scripts

В монорепе подготовлены команды под текущий VPS-паттерн соседних проектов:

- `.vscode/tasks.json`:
  - `Deploy night-hunger`
  - `Status night-hunger`
- `deploy-nighthunger.bat`
- `upload-to-server.bat`

`upload-to-server.bat` теперь также копирует шаблон nginx-конфига для `night-hunger` на сервер:

```text
/opt/bots/lazart/night-hunger/deploy/nginx/night-hunger.conf.example
```

---

## Troubleshooting

### Web не открывается из Telegram

Проверьте:

- `TELEGRAM_WEBAPP_URL` и `WEB_APP_URL` указывают на реальный `https://` домен
- хостовый nginx проксирует на `127.0.0.1:8080`
- `docker-compose ... ps` показывает `web` в состоянии `Up`

### Frontend не достучался до API

Проверьте:

- `VITE_API_URL=/api`
- proxy `/api` в `docker/web/nginx.conf`
- `FRONTEND_URL` в `.env`
- `api` контейнер доступен на `127.0.0.1:3000`

### API не запускается

Проверьте:

```bash
docker-compose --env-file .env -f docker/docker-compose.prod.yml logs api
docker-compose --env-file .env -f docker/docker-compose.prod.yml exec api printenv
```

### Redis недоступен

```bash
docker-compose --env-file .env -f docker/docker-compose.prod.yml exec redis redis-cli ping
```

Ожидаемый ответ: `PONG`