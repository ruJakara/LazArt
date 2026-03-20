# Deploy group_parser на VPS

## 1) Подготовка на сервере (один раз)

```bash
ssh root@89.191.225.207
cd /opt/bots/lazart/group_parser

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

## 2) Настройка переменных окружения

```bash
cd /opt/bots/lazart/group_parser
cp .env.example .env
nano .env
```

Минимально обязательные переменные:

- `TELEGRAM_BOT_TOKEN`
- `PAYMENT_PROVIDER_TOKEN`
- `VK_TOKEN`

## 3) Установка и запуск systemd-сервиса

```bash
cp /opt/bots/lazart/group_parser/kiberone-group-parser.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable kiberone-group-parser.service
systemctl start kiberone-group-parser.service
```

Проверка:

```bash
systemctl status kiberone-group-parser.service --no-pager
journalctl -u kiberone-group-parser.service -f
```

## 4) Обновление после изменений

```bash
cd /opt/bots/lazart/group_parser
bash deploy.sh
```

Или из корня монорепозитория:

```bash
bash deploy-all.sh
```

`deploy.sh` не перезапускает сервис, если в `.env` отсутствуют обязательные токены.
