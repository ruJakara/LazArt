# Deployment Guide

## Требования

- Docker & Docker Compose
- Доменное имя (для production)
- SSL сертификат (рекомендуется)

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

Заполните `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://postgres:password@localhost:5432/night_hunger
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

### 3. Запуск Docker (PostgreSQL + Redis)

```bash
npm run docker:up
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Доступ:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

---

## Production Deployment

### Вариант 1: Docker Compose

#### 1. Подготовка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt-get install docker-compose-plugin
```

#### 2. Клонирование проекта

```bash
git clone <repository-url>
cd night-hunger/docker
```

#### 3. Настройка окружения

Создайте `.env.production`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/night_hunger
REDIS_URL=redis://redis:6379
JWT_SECRET=your_super_secret_production_key
TELEGRAM_BOT_TOKEN=your_bot_token
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_NAME=night_hunger
```

#### 4. Запуск

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

#### 5. Проверка

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

### Вариант 2: Kubernetes (для масштабирования)

#### 1. Создание манифестов

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/night-hunger-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

#### 2. Применение

```bash
kubectl apply -f k8s/
```

---

## CI/CD (GitHub Actions)

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/night-hunger
            git pull
            docker-compose -f docker/docker-compose.prod.yml up -d --build
```

---

## Мониторинг

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Логи

```bash
# API
docker-compose logs -f api

# Web
docker-compose logs -f web

# Worker
docker-compose logs -f worker
```

### Метрики

- PostgreSQL: `pg_stat_activity`, `pg_stat_database`
- Redis: `INFO stats`, `INFO memory`
- Node.js: Prometheus + Grafana

---

## Backup Database

### Создание бэкапа

```bash
docker-compose exec postgres pg_dump -U postgres night_hunger > backup.sql
```

### Восстановление

```bash
docker-compose exec -T postgres psql -U postgres night_hunger < backup.sql
```

### Автоматизация (cron)

```bash
# /etc/cron.daily/backup-night-hunger
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres night_hunger > /backups/night_hunger_$DATE.sql
find /backups -name "night_hunger_*.sql" -mtime +7 -delete
```

---

## Troubleshooting

### API не запускается

```bash
# Проверка логов
docker-compose logs api

# Проверка подключения к БД
docker-compose exec api ping postgres
```

### Frontend не подключается к API

Проверьте CORS настройки в `services/api/src/main.ts`.

### Redis недоступен

```bash
docker-compose exec redis redis-cli ping
# Ответ: PONG
```

---

## Security Checklist

- [ ] Измените все пароли по умолчанию
- [ ] Используйте HTTPS (Let's Encrypt)
- [ ] Настройте firewall (только нужные порты)
- [ ] Регулярно обновляйте зависимости
- [ ] Включите rate limiting
- [ ] Настройте мониторинг безопасности
