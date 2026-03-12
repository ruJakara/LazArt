type StatKey = 'strength' | 'agility' | 'hp';
type GameActionType = 'attack' | 'escape' | 'feed';
type LeaderboardFilter = 'xp' | 'kills' | 'level';
type ShopType = 'default' | 'premium';

interface UserProfile {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  level: number;
  bloodBalance: number;
  xp: number;
  currentHp: number;
  maxHp: number;
  skinId: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  statPoints?: number;
}

interface UserStats {
  strength: number;
  agility: number;
  hp: number;
  currentHp: number;
  totalKills: number;
  totalXp: number;
}

interface Enemy {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
}

interface InventoryItem {
  itemId: string;
  itemType: string;
  quantity: number;
  name?: string;
  icon?: string;
  effectValue?: number | null;
}

interface ShopItem {
  id: number;
  itemId: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  rarity: string;
  price: number;
  currency: string;
  stock: number | null;
  minLevel: number;
  shopType: ShopType;
}

interface MockState {
  profile: UserProfile;
  stats: UserStats;
  huntEnemy: Enemy | null;
  inventory: InventoryItem[];
  shopItems: ShopItem[];
  referral: {
    code: string;
    referredCount: number;
    totalBonusClaimed: number;
    pendingBonus: number;
    referralLink: string;
  };
}

const MOCK_LATENCY_MS = 100;
const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);
type MockScope = 'all' | 'core' | 'extended';

const ENEMY_POOL = [
  { type: 'wolf', baseHp: 50, baseDamage: 6, baseXp: 45, baseBlood: 30 },
  { type: 'vampire_hunter', baseHp: 70, baseDamage: 9, baseXp: 65, baseBlood: 45 },
  { type: 'witch', baseHp: 95, baseDamage: 12, baseXp: 90, baseBlood: 60 },
  { type: 'demon', baseHp: 120, baseDamage: 16, baseXp: 120, baseBlood: 85 },
  { type: 'angel', baseHp: 150, baseDamage: 20, baseXp: 150, baseBlood: 110 },
] as const;

const mockState: MockState = {
  profile: {
    id: 100001,
    username: 'night_hunter',
    firstName: 'Night',
    lastName: 'Hunter',
    level: 6,
    bloodBalance: 1200,
    xp: 880,
    currentHp: 140,
    maxHp: 140,
    skinId: 'default',
    isPremium: false,
    premiumExpiresAt: null,
    statPoints: 3,
  },
  stats: {
    strength: 8,
    agility: 7,
    hp: 14,
    currentHp: 140,
    totalKills: 22,
    totalXp: 880,
  },
  huntEnemy: null,
  inventory: [
    { itemId: 'potion_small', itemType: 'potion', quantity: 3, name: 'Малое зелье', icon: '🧪', effectValue: 30 },
    { itemId: 'rage_boost', itemType: 'boost', quantity: 2, name: 'Ярость', icon: '⚡', effectValue: 15 },
    { itemId: 'skin_crimson', itemType: 'skin', quantity: 1, name: 'Crimson Cloak', icon: '🧥', effectValue: null },
  ],
  shopItems: [
    {
      id: 1,
      itemId: 'potion_small',
      name: 'Малое зелье',
      description: 'Восстанавливает 30 HP',
      icon: '🧪',
      type: 'potion',
      rarity: 'common',
      price: 80,
      currency: 'blood',
      stock: null,
      minLevel: 1,
      shopType: 'default',
    },
    {
      id: 2,
      itemId: 'rage_boost',
      name: 'Ярость',
      description: 'Временный бонус к атаке',
      icon: '⚡',
      type: 'boost',
      rarity: 'rare',
      price: 200,
      currency: 'blood',
      stock: 12,
      minLevel: 4,
      shopType: 'default',
    },
    {
      id: 3,
      itemId: 'skin_crimson',
      name: 'Crimson Cloak',
      description: 'Редкий скин вампира',
      icon: '🧥',
      type: 'skin',
      rarity: 'epic',
      price: 550,
      currency: 'blood',
      stock: 2,
      minLevel: 6,
      shopType: 'premium',
    },
  ],
  referral: {
    code: 'REF001001',
    referredCount: 4,
    totalBonusClaimed: 300,
    pendingBonus: 100,
    referralLink: 'https://t.me/night_hunger_bot?start=REF001001',
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function xpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function recalcHp() {
  mockState.profile.maxHp = 70 + mockState.stats.hp * 5;
  mockState.profile.currentHp = clamp(mockState.profile.currentHp, 0, mockState.profile.maxHp);
  mockState.stats.currentHp = mockState.profile.currentHp;
}

function makeApiError(message: string): never {
  const error = new Error(message) as Error & {
    response?: { data?: { message?: string } };
  };
  error.response = { data: { message } };
  throw error;
}

function pickEnemy(): Enemy {
  const template = ENEMY_POOL[randomInt(0, ENEMY_POOL.length - 1)];
  const enemyLevel = Math.max(1, mockState.profile.level + randomInt(-1, 2));
  const maxHp = template.baseHp + enemyLevel * 12;
  const damage = template.baseDamage + Math.floor(enemyLevel * 1.3);

  return {
    type: template.type,
    level: enemyLevel,
    hp: maxHp,
    maxHp,
    damage,
  };
}

function awardForEnemy(enemy: Enemy): { xp: number; blood: number } {
  const template = ENEMY_POOL.find((entry) => entry.type === enemy.type);
  if (!template) {
    return { xp: enemy.level * 40, blood: enemy.level * 28 };
  }
  return {
    xp: template.baseXp + enemy.level * 12,
    blood: template.baseBlood + enemy.level * 8,
  };
}

function applyLevelUps(): number {
  let levelUps = 0;
  while (mockState.profile.xp >= xpForNextLevel(mockState.profile.level)) {
    mockState.profile.level += 1;
    mockState.profile.statPoints = (mockState.profile.statPoints || 0) + 3;
    mockState.stats.strength += 1;
    mockState.stats.agility += 1;
    mockState.stats.hp += 1;
    levelUps += 1;
  }
  recalcHp();
  return levelUps;
}

function getSellPrice(itemId: string): number {
  const shopItem = mockState.shopItems.find((entry) => entry.itemId === itemId);
  if (!shopItem) return 25;
  return Math.max(15, Math.floor(shopItem.price * 0.45));
}

async function withLatency<T>(producer: () => T): Promise<T> {
  await sleep(MOCK_LATENCY_MS);
  return producer();
}

export function isMockApiEnabled(): boolean {
  const value = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').trim().toLowerCase();
  if (ENABLED_VALUES.has(value)) return true;
  if (DISABLED_VALUES.has(value)) return false;
  return true;
}

function getScopedMockFlag(scope: MockScope): boolean {
  if (scope === 'all') {
    return isMockApiEnabled();
  }

  const scopedFlagName = scope === 'core' ? 'VITE_USE_MOCK_CORE_API' : 'VITE_USE_MOCK_EXTENDED_API';
  const scopedValue = String(import.meta.env[scopedFlagName] ?? '').trim().toLowerCase();

  if (ENABLED_VALUES.has(scopedValue)) return true;
  if (DISABLED_VALUES.has(scopedValue)) return false;

  return isMockApiEnabled();
}

export async function withMockApi<T>(
  realCall: () => Promise<T>,
  mockCall: () => Promise<T>,
  scope: MockScope = 'all',
): Promise<T> {
  if (getScopedMockFlag(scope)) {
    return mockCall();
  }
  return realCall();
}

export const mockBackend = {
  validateInitData: async (initData: string) =>
    withLatency(() => ({
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      user: {
        id: mockState.profile.id,
        username: mockState.profile.username,
        firstName: mockState.profile.firstName,
        lastName: mockState.profile.lastName,
      },
      initData,
    })),

  refreshToken: async () =>
    withLatency(() => ({
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    })),

  getProfile: async () =>
    withLatency(() => {
      recalcHp();
      return copy(mockState.profile);
    }),

  getStats: async () =>
    withLatency(() => {
      mockState.stats.currentHp = mockState.profile.currentHp;
      mockState.stats.totalXp = mockState.profile.xp;
      return copy(mockState.stats);
    }),

  startHunt: async () =>
    withLatency(() => {
      if (mockState.profile.currentHp <= 0) {
        makeApiError('Вы мертвы. Используйте воскрешение.');
      }

      if (!mockState.huntEnemy) {
        mockState.huntEnemy = pickEnemy();
      }

      return {
        enemy: copy(mockState.huntEnemy),
        canEscape: true,
        canAttack: true,
      };
    }),

  performAction: async (action: GameActionType) =>
    withLatency(() => {
      const enemy = mockState.huntEnemy;
      if (!enemy) {
        makeApiError('Нет активной охоты. Нажмите "Начать охоту".');
      }

      const activeEnemy = enemy as Enemy;
      let success = false;
      let escaped = false;
      let xpGained = 0;
      let bloodGained = 0;
      let hpLost = 0;
      let message = 'Действие выполнено.';

      if (action === 'attack') {
        const playerDamage = Math.max(6, mockState.stats.strength * 2 + randomInt(0, 5));
        activeEnemy.hp = Math.max(0, activeEnemy.hp - playerDamage);

        if (activeEnemy.hp === 0) {
          const rewards = awardForEnemy(activeEnemy);
          xpGained = rewards.xp;
          bloodGained = rewards.blood;
          mockState.profile.xp += xpGained;
          mockState.profile.bloodBalance += bloodGained;
          mockState.stats.totalKills += 1;
          mockState.stats.totalXp = mockState.profile.xp;
          success = true;

          const levelUps = applyLevelUps();
          message = `Победа! +${xpGained} XP, +${bloodGained} крови.`;
          if (levelUps > 0) {
            message = `${message} Уровень повышен! Теперь ${mockState.profile.level}.`;
          }
          mockState.huntEnemy = null;
        } else {
          const enemyDamage = Math.max(4, activeEnemy.damage - Math.floor(mockState.stats.agility / 2));
          mockState.profile.currentHp = Math.max(0, mockState.profile.currentHp - enemyDamage);
          hpLost = enemyDamage;
          recalcHp();

          if (mockState.profile.currentHp === 0) {
            message = `Вы нанесли ${playerDamage} урона, но враг добил вас.`;
            mockState.huntEnemy = null;
          } else {
            message = `Вы нанесли ${playerDamage} урона и получили ${enemyDamage} в ответ.`;
          }
        }
      } else if (action === 'escape') {
        const escapeChance = clamp(0.25 + mockState.stats.agility * 0.05, 0.25, 0.85);
        const didEscape = Math.random() < escapeChance;

        if (didEscape) {
          success = true;
          escaped = true;
          message = 'Вы успешно скрылись в ночи.';
          mockState.huntEnemy = null;
        } else {
          const enemyDamage = Math.max(4, activeEnemy.damage - Math.floor(mockState.stats.agility / 3));
          mockState.profile.currentHp = Math.max(0, mockState.profile.currentHp - enemyDamage);
          hpLost = enemyDamage;
          recalcHp();
          message =
            mockState.profile.currentHp === 0
              ? 'Побег провален. Вы погибли.'
              : `Побег провален. Враг наносит ${enemyDamage} урона.`;
          if (mockState.profile.currentHp === 0) {
            mockState.huntEnemy = null;
          }
        }
      } else {
        if (activeEnemy.hp > 0) {
          makeApiError('Поглощение доступно только после победы над врагом.');
        }
        const heal = Math.min(25 + mockState.stats.agility, mockState.profile.maxHp - mockState.profile.currentHp);
        mockState.profile.currentHp += heal;
        recalcHp();
        success = true;
        message = `Вы восстановили ${heal} HP.`;
        mockState.huntEnemy = null;
      }

      return {
        success,
        xpGained,
        bloodGained,
        hpLost,
        playerHp: mockState.profile.currentHp,
        enemyHp: mockState.huntEnemy?.hp ?? 0,
        enemyMaxHp: mockState.huntEnemy?.maxHp ?? 0,
        escaped,
        message,
      };
    }),

  getGameState: async () =>
    withLatency(() => ({
      user: {
        id: mockState.profile.id,
        level: mockState.profile.level,
        xp: mockState.profile.xp,
        bloodBalance: mockState.profile.bloodBalance,
        currentHp: mockState.profile.currentHp,
        maxHp: mockState.profile.maxHp,
      },
      currentHunt: mockState.huntEnemy
        ? {
            enemy: copy(mockState.huntEnemy),
            userHp: mockState.profile.currentHp,
          }
        : null,
    })),

  respawn: async () =>
    withLatency(() => {
      if (mockState.profile.currentHp > 0) {
        return {
          success: false,
          message: 'Вы уже живы.',
        };
      }
      const restoredHp = Math.max(40, Math.floor(mockState.profile.maxHp * 0.5));
      mockState.profile.currentHp = restoredHp;
      mockState.huntEnemy = null;
      recalcHp();
      return {
        success: true,
        message: `Вы воскресли и восстановили ${restoredHp} HP.`,
      };
    }),

  getUpgradeOptions: async () =>
    withLatency(() => {
      const statPoints = mockState.profile.statPoints || 0;
      return (['strength', 'agility', 'hp'] as StatKey[]).map((stat) => {
        const currentLevel = mockState.stats[stat];
        const cost = 100 * currentLevel;
        return {
          stat,
          currentLevel,
          cost,
          nextLevelBonus: stat === 'hp' ? 5 : 1,
          canAfford: mockState.profile.bloodBalance >= cost,
          hasStatPoints: statPoints > 0,
        };
      });
    }),

  buyUpgrade: async (stat: StatKey) =>
    withLatency(() => {
      const currentLevel = mockState.stats[stat];
      const cost = 100 * currentLevel;

      if ((mockState.profile.statPoints || 0) <= 0) {
        makeApiError('Недостаточно очков характеристик.');
      }
      if (mockState.profile.bloodBalance < cost) {
        makeApiError('Недостаточно крови для улучшения.');
      }

      mockState.profile.bloodBalance -= cost;
      mockState.profile.statPoints = (mockState.profile.statPoints || 0) - 1;
      mockState.stats[stat] += 1;

      if (stat === 'hp') {
        recalcHp();
        mockState.profile.currentHp = Math.min(mockState.profile.maxHp, mockState.profile.currentHp + 8);
      }

      return {
        success: true,
        stat,
        newLevel: mockState.stats[stat],
        cost,
        message: `Характеристика "${stat}" улучшена до ${mockState.stats[stat]}.`,
      };
    }),

  getInventory: async () => withLatency(() => copy(mockState.inventory)),

  useItem: async (itemId: string) =>
    withLatency(() => {
      const item = mockState.inventory.find((entry) => entry.itemId === itemId && entry.quantity > 0);
      if (!item) {
        makeApiError('Предмет недоступен.');
      }

      const activeItem = item as InventoryItem;
      activeItem.quantity -= 1;

      let effect: { type: string; value: number } | undefined;
      let message = `Использовано: ${activeItem.name || activeItem.itemId}.`;

      if (activeItem.itemType === 'potion') {
        const healAmount = activeItem.effectValue || 30;
        const before = mockState.profile.currentHp;
        mockState.profile.currentHp = Math.min(mockState.profile.maxHp, mockState.profile.currentHp + healAmount);
        recalcHp();
        effect = { type: 'heal', value: mockState.profile.currentHp - before };
        message = `Восстановлено ${effect.value} HP.`;
      } else if (activeItem.itemType === 'boost') {
        const bonus = activeItem.effectValue || 10;
        mockState.profile.bloodBalance += bonus;
        effect = { type: 'boost', value: bonus };
        message = `Бонус: +${bonus} крови.`;
      } else if (activeItem.itemType === 'skin') {
        mockState.profile.skinId = activeItem.itemId;
        message = `Скин "${activeItem.name || activeItem.itemId}" применен.`;
      }

      return {
        success: true,
        itemId,
        message,
        effect,
      };
    }),

  sellItem: async (itemId: string, quantity = 1) =>
    withLatency(() => {
      const item = mockState.inventory.find((entry) => entry.itemId === itemId && entry.quantity > 0);
      if (!item) {
        makeApiError('Предмет для продажи не найден.');
      }

      const activeItem = item as InventoryItem;
      if (activeItem.itemType === 'skin') {
        makeApiError('Скины нельзя продавать.');
      }

      const sellQuantity = Math.min(quantity, activeItem.quantity);
      const totalReceived = sellQuantity * getSellPrice(itemId);
      activeItem.quantity -= sellQuantity;
      mockState.profile.bloodBalance += totalReceived;

      return {
        success: true,
        itemId,
        soldQuantity: sellQuantity,
        totalReceived,
        message: `Продано ${sellQuantity} шт. за ${totalReceived} крови.`,
      };
    }),

  getShopItems: async (type: ShopType) =>
    withLatency(() =>
      mockState.shopItems
        .filter((item) => item.shopType === type)
        .map((item) => ({
          ...copy(item),
          canAfford: mockState.profile.bloodBalance >= item.price,
          meetsLevelRequirement: mockState.profile.level >= item.minLevel,
        })),
    ),

  buyShopItem: async (itemId: string, shopType: ShopType = 'default') =>
    withLatency(() => {
      const item = mockState.shopItems.find((entry) => entry.itemId === itemId && entry.shopType === shopType);
      if (!item) {
        makeApiError('Товар не найден.');
      }

      const activeItem = item as ShopItem;

      if (mockState.profile.level < activeItem.minLevel) {
        makeApiError(`Нужен ${activeItem.minLevel} уровень.`);
      }
      if (mockState.profile.bloodBalance < activeItem.price) {
        makeApiError('Недостаточно крови.');
      }
      if (activeItem.stock !== null && activeItem.stock <= 0) {
        makeApiError('Товар закончился.');
      }

      mockState.profile.bloodBalance -= activeItem.price;
      if (activeItem.stock !== null) {
        activeItem.stock -= 1;
      }

      const inventoryItem = mockState.inventory.find((entry) => entry.itemId === itemId);
      if (inventoryItem) {
        inventoryItem.quantity += 1;
      } else {
        mockState.inventory.push({
          itemId: activeItem.itemId,
          itemType: activeItem.type,
          quantity: 1,
          name: activeItem.name,
          icon: activeItem.icon || undefined,
          effectValue: activeItem.type === 'potion' ? 30 : activeItem.type === 'boost' ? 10 : null,
        });
      }

      return {
        success: true,
        itemId: activeItem.itemId,
        itemName: activeItem.name,
        quantity: 1,
        totalPaid: activeItem.price,
        message: `Куплено: ${activeItem.name}.`,
      };
    }),

  getLeaderboard: async (limit = 50, offset = 0, filter: LeaderboardFilter = 'xp') =>
    withLatency(() => {
      const bots = [
        { userId: 501, username: 'BloodWolf', totalXp: 1380, level: 9, totalKills: 39 },
        { userId: 502, username: 'DarkAlly', totalXp: 1120, level: 8, totalKills: 28 },
        { userId: 503, username: 'NightQueen', totalXp: 980, level: 7, totalKills: 24 },
        { userId: 504, username: 'SilentFang', totalXp: 840, level: 6, totalKills: 21 },
      ];

      const currentUser = {
        userId: mockState.profile.id,
        username: mockState.profile.username || 'Игрок',
        totalXp: mockState.profile.xp,
        level: mockState.profile.level,
        totalKills: mockState.stats.totalKills,
      };

      const ranking = [...bots, currentUser];
      ranking.sort((a, b) => {
        if (filter === 'kills') return b.totalKills - a.totalKills;
        if (filter === 'level') return b.level - a.level;
        return b.totalXp - a.totalXp;
      });

      const leaderboard = ranking.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));
      const page = leaderboard.slice(offset, offset + limit);

      return {
        leaderboard: page,
        total: leaderboard.length,
      };
    }),

  getMyPosition: async () =>
    withLatency(async () => {
      const data = await mockBackend.getLeaderboard(100, 0, 'xp');
      const entry = data.leaderboard.find((item) => item.userId === mockState.profile.id);
      const rank = entry?.rank || data.total;
      return {
        rank,
        totalXp: mockState.profile.xp,
        totalKills: mockState.stats.totalKills,
        level: mockState.profile.level,
        percentile: (rank / Math.max(1, data.total)) * 100,
      };
    }),

  getReferralInfo: async () =>
    withLatency(() => copy(mockState.referral)),

  claimReferralBonus: async () =>
    withLatency(() => {
      if (mockState.referral.pendingBonus <= 0) {
        return {
          success: false,
          bonus: 0,
          message: 'Нет доступных бонусов.',
        };
      }

      const bonus = mockState.referral.pendingBonus;
      mockState.referral.pendingBonus = 0;
      mockState.referral.totalBonusClaimed += bonus;
      mockState.profile.bloodBalance += bonus;

      return {
        success: true,
        bonus,
        message: `Получено ${bonus} крови.`,
      };
    }),
};
