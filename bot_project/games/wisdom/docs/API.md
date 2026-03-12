# Night Hunger API Documentation

## Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.nighthunger.com/api`

## Authentication

All protected endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token

Tokens are automatically issued when users authenticate via Telegram WebApp.

---

## Endpoints

### 👤 User Module

#### GET `/api/user/profile`
Get current user profile

**Response:**
```json
{
  "id": "123456789",
  "username": "player_name",
  "firstName": "First",
  "lastName": "Last",
  "level": 5,
  "xp": 500,
  "bloodBalance": 1000,
  "currentHp": 80,
  "maxHp": 100,
  "statsStrength": 10,
  "statsAgility": 10,
  "statPoints": 5,
  "skinId": "default",
  "isPremium": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/api/user/stats`
Get user statistics

**Response:**
```json
{
  "totalHunts": 150,
  "totalKills": 120,
  "totalDeaths": 30,
  "winRate": 0.8,
  "totalXpEarned": 15000,
  "totalBloodEarned": 5000,
  "playTimeHours": 25.5
}
```

---

### 🎮 Game Module

#### GET `/api/game/hunt`
Start a new hunt

**Response:**
```json
{
  "enemy": {
    "type": "wolf",
    "level": 5,
    "hp": 75,
    "maxHp": 75,
    "damage": 8
  },
  "canAttack": true,
  "canEscape": true
}
```

#### POST `/api/game/action`
Perform combat action

**Request:**
```json
{
  "action": "attack" // "attack" | "escape" | "feed"
}
```

**Response:**
```json
{
  "success": true,
  "xpGained": 50,
  "bloodGained": 20,
  "hpLost": 5,
  "playerHp": 75,
  "enemyHp": 25,
  "enemyMaxHp": 75,
  "escaped": false,
  "message": "⚔️ Вы атаковали и нанесли 15 урона | Враг нанес 5 урона в ответ"
}
```

#### GET `/api/game/state`
Get current game state

**Response:**
```json
{
  "user": {
    "id": "123456789",
    "level": 5,
    "xp": 500,
    "bloodBalance": 1000,
    "currentHp": 75,
    "maxHp": 100
  },
  "currentHunt": {
    "enemy": {
      "type": "wolf",
      "level": 5,
      "hp": 25,
      "maxHp": 75
    },
    "userHp": 75
  }
}
```

#### POST `/api/game/respawn`
Respawn after death

**Response:**
```json
{
  "success": true,
  "message": "Вы воскресли с 50 HP"
}
```

---

### ⚡ Upgrade Module

#### GET `/api/upgrade/options`
Get available upgrade options

**Response:**
```json
{
  "options": [
    {
      "type": "strength",
      "current": 10,
      "cost": 100,
      "bonus": "+1 Strength"
    },
    {
      "type": "agility",
      "current": 10,
      "cost": 100,
      "bonus": "+1 Agility"
    },
    {
      "type": "hp",
      "current": 100,
      "cost": 100,
      "bonus": "+10 Max HP"
    }
  ]
}
```

#### POST `/api/upgrade/buy`
Purchase an upgrade

**Request:**
```json
{
  "type": "strength" // "strength" | "agility" | "hp"
}
```

**Response:**
```json
{
  "success": true,
  "newStat": 11,
  "bloodBalance": 900,
  "message": "Улучшение приобретено! Сила: 11"
}
```

---

### 🎒 Inventory Module

#### GET `/api/inventory`
Get user inventory

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "itemId": "health_potion_small",
      "itemType": "potion",
      "quantity": 5,
      "name": "Малое зелье лечения",
      "description": "Восстанавливает 50 HP"
    },
    {
      "id": 2,
      "itemId": "vampire_lord",
      "itemType": "skin",
      "quantity": 1,
      "name": "Вампир Лорд",
      "description": "Легендарная кожа"
    }
  ]
}
```

#### POST `/api/inventory/use`
Use an item

**Request:**
```json
{
  "itemId": "health_potion_small"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Зелье использовано. +50 HP",
  "remaining": 4
}
```

#### POST `/api/inventory/sell`
Sell an item

**Request:**
```json
{
  "itemId": "health_potion_small",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "bloodReceived": 50,
  "remaining": 3
}
```

---

### 🏪 Shop Module

#### GET `/api/shop/items`
Get shop items

**Query Parameters:**
- `category` (optional): Filter by category (potion, skin, boost)
- `currency` (optional): Filter by currency (blood, stars)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "itemId": "health_potion_small",
      "name": "Малое зелье лечения",
      "description": "Восстанавливает 50 HP",
      "price": 50,
      "currency": "blood",
      "category": "potion",
      "inStock": true
    },
    {
      "id": 2,
      "itemId": "vampire_lord",
      "name": "Вампир Лорд",
      "description": "Легендарная кожа",
      "price": 1000,
      "currency": "stars",
      "category": "skin",
      "inStock": true
    }
  ]
}
```

#### POST `/api/shop/buy`
Buy an item

**Request:**
```json
{
  "itemId": "health_potion_small",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "bloodSpent": 50,
  "message": "Покупка успешна!"
}
```

---

### 🏆 Leaderboard Module

#### GET `/api/leaderboard`
Get top players

**Query Parameters:**
- `limit` (optional): Number of entries (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `filter` (optional): Sort by (xp, kills, blood)

**Response:**
```json
{
  "entries": [
    {
      "rank": 1,
      "userId": "987654321",
      "username": "top_player",
      "level": 50,
      "totalXp": 100000,
      "totalKills": 500
    },
    {
      "rank": 2,
      "userId": "876543210",
      "username": "hunter_pro",
      "level": 45,
      "totalXp": 85000,
      "totalKills": 420
    }
  ],
  "total": 1000
}
```

#### GET `/api/leaderboard/me`
Get my leaderboard position

**Response:**
```json
{
  "rank": 150,
  "userId": "123456789",
  "username": "player_name",
  "level": 5,
  "totalXp": 500,
  "totalKills": 25,
  "totalPlayers": 1000
}
```

---

### 👥 Referral Module

#### GET `/api/referral/code`
Get my referral code

**Response:**
```json
{
  "code": "ABC123",
  "url": "https://t.me/night_hunger_bot?start=ABC123",
  "referralsCount": 5,
  "bonusAvailable": 500
}
```

#### GET `/api/referral/bonus`
Claim referral bonus

**Response:**
```json
{
  "success": true,
  "bloodReceived": 500,
  "message": "Бонус за реферала получен! +500 крови"
}
```

---

### 💳 Payment Module

#### POST `/api/payment/create`
Create a payment

**Request:**
```json
{
  "itemId": "premium_stars_100",
  "currency": "stars"
}
```

**Response:**
```json
{
  "paymentId": "pay_123456",
  "providerPaymentId": "telegram_pay_id",
  "amount": 100,
  "currency": "XTR",
  "status": "pending"
}
```

#### POST `/api/payment/webhook`
Telegram payment webhook (internal)

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "errors": ["Field 'action' is required"]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Not found"
}
```

### 409 Conflict (Cooldown)
```json
{
  "statusCode": 409,
  "message": "Слишком часто. Попробуйте через 5 сек."
}
```

### 429 Too Many Requests (Rate Limit)
```json
{
  "statusCode": 429,
  "message": "Too many requests"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Default:** 100 requests per minute per IP
- **Game actions:** 1 request per second per user
- **Hunt:** 1 request per 5 seconds per user

---

## WebSocket Events

### Combat Updates
```json
{
  "event": "combat_update",
  "data": {
    "playerHp": 75,
    "enemyHp": 25,
    "lastAction": "attack"
  }
}
```

---

## OpenAPI Specification

Full OpenAPI (Swagger) spec available at:
- **Development:** `http://localhost:3000/api/docs`
- **Production:** `https://api.nighthunger.com/api/docs`
