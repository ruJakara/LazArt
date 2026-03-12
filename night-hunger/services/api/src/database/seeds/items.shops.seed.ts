import { QueryRunner } from 'typeorm';

export async function seedItemsAndShops(queryRunner: QueryRunner): Promise<void> {
  // Предметы (справочник)
  const items = [
    // Зелья
    {
      id: 'potion_hp_small',
      name: 'Малое зелье здоровья',
      description: 'Восстанавливает 50 HP',
      type: 'potion',
      rarity: 'common',
      effect_value: 50,
      effect_duration: null,
      buy_price: 50,
      sell_price: 25,
      icon: '🧪',
      is_tradeable: true,
      is_usable: true,
    },
    {
      id: 'potion_hp_medium',
      name: 'Среднее зелье здоровья',
      description: 'Восстанавливает 100 HP',
      type: 'potion',
      rarity: 'common',
      effect_value: 100,
      effect_duration: null,
      buy_price: 100,
      sell_price: 50,
      icon: '🧪',
      is_tradeable: true,
      is_usable: true,
    },
    {
      id: 'potion_hp_large',
      name: 'Большое зелье здоровья',
      description: 'Восстанавливает 250 HP',
      type: 'potion',
      rarity: 'rare',
      effect_value: 250,
      effect_duration: null,
      buy_price: 200,
      sell_price: 100,
      icon: '🧪',
      is_tradeable: true,
      is_usable: true,
    },
    // Бусты
    {
      id: 'boost_strength_small',
      name: 'Зелье силы',
      description: '+5 к Силе на 5 минут',
      type: 'boost',
      rarity: 'rare',
      effect_value: 5,
      effect_duration: 300,
      buy_price: 150,
      sell_price: 75,
      icon: '💪',
      is_tradeable: true,
      is_usable: true,
    },
    {
      id: 'boost_agility_small',
      name: 'Зелье ловкости',
      description: '+5 к Ловкости на 5 минут',
      type: 'boost',
      rarity: 'rare',
      effect_value: 5,
      effect_duration: 300,
      buy_price: 150,
      sell_price: 75,
      icon: '⚡',
      is_tradeable: true,
      is_usable: true,
    },
    // Скины
    {
      id: 'skin_classic',
      name: 'Классический',
      description: 'Стандартный внешний вид',
      type: 'skin',
      rarity: 'common',
      effect_value: null,
      effect_duration: null,
      buy_price: 0,
      sell_price: 0,
      icon: '🧛',
      is_tradeable: false,
      is_usable: true,
    },
    {
      id: 'skin_crimson',
      name: 'Багровый лорд',
      description: 'Элитный скин багрового цвета',
      type: 'skin',
      rarity: 'epic',
      effect_value: null,
      effect_duration: null,
      buy_price: 500,
      sell_price: 250,
      icon: '🩸',
      is_tradeable: false,
      is_usable: true,
    },
    {
      id: 'skin_shadow',
      name: 'Теневой охотник',
      description: 'Скин тёмного охотника',
      type: 'skin',
      rarity: 'legendary',
      effect_value: null,
      effect_duration: null,
      buy_price: 1000,
      sell_price: 500,
      icon: '🌑',
      is_tradeable: false,
      is_usable: true,
    },
    {
      id: 'skin_golden',
      name: 'Золотой вампир',
      description: 'Премиум скин золотого цвета',
      type: 'skin',
      rarity: 'legendary',
      effect_value: null,
      effect_duration: null,
      buy_price: 1500,
      sell_price: 750,
      icon: '✨',
      is_tradeable: false,
      is_usable: true,
    },
  ];

  for (const item of items) {
    await queryRunner.query(
      `INSERT INTO items (id, name, description, type, rarity, effect_value, effect_duration, buy_price, sell_price, icon, is_tradeable, is_usable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.name,
        item.description,
        item.type,
        item.rarity,
        item.effect_value,
        item.effect_duration,
        item.buy_price,
        item.sell_price,
        item.icon,
        item.is_tradeable,
        item.is_usable,
      ]
    );
  }

  // Товары магазина
  const shops = [
    // Default shop - зелья
    { item_id: 'potion_hp_small', shop_type: 'default', price: 50, currency: 'blood', stock: null, min_level: 1, sort_order: 1 },
    { item_id: 'potion_hp_medium', shop_type: 'default', price: 100, currency: 'blood', stock: null, min_level: 5, sort_order: 2 },
    { item_id: 'potion_hp_large', shop_type: 'default', price: 200, currency: 'blood', stock: null, min_level: 10, sort_order: 3 },
    // Default shop - бусты
    { item_id: 'boost_strength_small', shop_type: 'default', price: 150, currency: 'blood', stock: null, min_level: 3, sort_order: 4 },
    { item_id: 'boost_agility_small', shop_type: 'default', price: 150, currency: 'blood', stock: null, min_level: 3, sort_order: 5 },
    // Default shop - скины
    { item_id: 'skin_classic', shop_type: 'default', price: 0, currency: 'blood', stock: null, min_level: 1, sort_order: 6 },
    { item_id: 'skin_crimson', shop_type: 'default', price: 500, currency: 'blood', stock: null, min_level: 5, sort_order: 7 },
    // Premium shop
    { item_id: 'skin_shadow', shop_type: 'premium', price: 1000, currency: 'blood', stock: null, min_level: 10, sort_order: 1 },
    { item_id: 'skin_golden', shop_type: 'premium', price: 1500, currency: 'blood', stock: null, min_level: 15, sort_order: 2 },
  ];

  for (const shop of shops) {
    await queryRunner.query(
      `INSERT INTO shops (item_id, shop_type, price, currency, stock, min_level, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       ON CONFLICT DO NOTHING`,
      [
        shop.item_id,
        shop.shop_type,
        shop.price,
        shop.currency,
        shop.stock,
        shop.min_level,
        shop.sort_order,
      ]
    );
  }
}
