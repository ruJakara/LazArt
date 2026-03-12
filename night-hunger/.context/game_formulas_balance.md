# Формулы и баланс

## Урон
- `Damage = Strength * 1.5 - Enemy_Armor`
- Минимальный урон: 1

## Шанс побега
- `EscapeChance = (Agility / Enemy_Agility) * 100`
- Кап шанса: 90%

## Опыт для уровня
- `XP_Needed = Base_XP * (Level ^ 1.5)`
- Base_XP = 100

## Экономика
- 1单位 крови = 0.1 XP (при обмене)
- Стоимость прокачки Силы: `100 * Level`