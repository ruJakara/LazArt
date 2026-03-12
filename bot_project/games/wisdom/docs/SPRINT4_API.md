# API Документация: Спринт 4

**Социал и Монетизация**

---

## 📑 Содержание

- [Leaderboard](#leaderboard)
- [Referral](#referral)
- [Payment](#payment)
- [Notification](#notification)

---

## Leaderboard

### GET `/api/leaderboard`

Получить таблицу лидеров.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| limit | number | 50 | Количество записей (макс. 100) |
| offset | number | 0 | Смещение для пагинации |
| filter | string | 'xp' | Фильтр: 'xp', 'kills', 'level' |

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": 123456,
      "username": "top_player",
      "totalXp": 10000,
      "level": 10,
      "totalKills": 50
    }
  ],
  "total": 50
}
```

---

### GET `/api/leaderboard/me`

Получить позицию текущего игрока.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "rank": 15,
  "totalXp": 5000,
  "totalKills": 25,
  "level": 5,
  "percentile": 85.5
}
```

---

## Referral

### GET `/api/referral/code`

Получить реферальный код и статистику.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "code": "REF123ABC",
  "referredCount": 5,
  "totalBonusClaimed": 300,
  "pendingBonus": 200,
  "referralLink": "https://t.me/NightHungerBot?start=REF123ABC"
}
```

---

### POST `/api/referral/bonus`

Забрать доступные реферальные бонусы.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:** (пустое)

**Response:**
```json
{
  "success": true,
  "bonus": 200,
  "message": "Получено 200 крови за 2 реферал(ов)"
}
```

---

## Payment

### POST `/api/payment/create`

Создать новый платёж.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "amount": 100,
  "currency": "stars",
  "description": "Покупка крови",
  "itemId": "blood_pack_100"
}
```

**Response:**
```json
{
  "paymentId": "payment_1234567890",
  "amount": 100,
  "currency": "stars",
  "status": "pending",
  "invoiceUrl": "https://t.me/bot/invoice?payload=...",
  "expiresAt": 1709856000000
}
```

---

### GET `/api/payment/status/:paymentId`

Получить статус платежа.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "payment_1234567890",
  "userId": 123456,
  "amount": 100,
  "currency": "stars",
  "status": "completed",
  "description": "Покупка крови",
  "createdAt": "2024-03-07T10:00:00Z",
  "completedAt": "2024-03-07T10:05:00Z"
}
```

---

### GET `/api/payment/history`

Получить историю платежей.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "history": [
    {
      "id": "payment_1234567890",
      "userId": 123456,
      "amount": 100,
      "currency": "stars",
      "status": "completed",
      "createdAt": "2024-03-07T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/payment/webhook`

Webhook для обработки платежей от Telegram.

**Headers:** (нет)

**Body:**
```json
{
  "id": "payment_1234567890",
  "user_id": 123456,
  "amount": 100,
  "status": "paid",
  "description": "Покупка крови"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Notification

### POST `/api/notification/send`

Отправить push-уведомление.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "message": "Напоминание: пора на охоту!",
  "type": "push",
  "priority": "normal",
  "data": "{\"action\": \"hunt\"}"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_123",
  "message": "Notification queued"
}
```

---

### POST `/api/notification/reminder`

Запланировать напоминание.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "message": "Ежедневная охота!",
  "timestamp": 1709856000000,
  "type": "hunt_reminder"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_456",
  "message": "Reminder scheduled"
}
```

---

### DELETE `/api/notification/reminder/:jobId`

Отменить запланированное напоминание.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

## 📊 Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Неавторизован |
| 404 | Ресурс не найден |
| 409 | Конфликт (например, уже использован код) |
| 500 | Внутренняя ошибка сервера |

---

## 🔐 Авторизация

Все запросы к API (кроме webhook) требуют заголовок:
```
Authorization: Bearer <jwt_token>
```

Токен получается через `/api/auth/validate` после входа через Telegram.

---

## 📈 Кэширование

Leaderboard кэшируется в Redis на 5 минут. Для принудительного обновления используйте инвалидацию кэша.
