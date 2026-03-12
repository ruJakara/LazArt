# API Endpoints

## POST /api/auth/validate
- Body: `{ initData: string }`
- Response: `{ token: string, user: UserObject }`
- Описание: Проверка данных от Telegram.

## GET /api/game/hunt
- Headers: `Authorization: Bearer <token>`
- Response: `{ enemy: EnemyObject, can_escape: boolean, can_attack: boolean }`
- Описание: Генерация случайной встречи.

## POST /api/game/action
- Body: `{ action: 'attack' | 'escape', enemy_id: string }`
- Response: `{ success: boolean, reward: number, new_stats: StatsObject }`
- Описание: Результат действия игрока.