export const GAME_CONFIG = {
  BASE_XP: 100,
  BASE_HP: 100,
  BASE_DAMAGE: 10,
  HUNT_COOLDOWN: 5000,
  ACTION_COOLDOWN: 1000,
  MAX_LEVEL: 100,
  XP_MULTIPLIER: 1.5,
  MIN_DAMAGE: 1,
  MAX_ESCAPE_CHANCE: 90,
  MIN_ESCAPE_CHANCE: 10,
  BASE_UPGRADE_COST: 100,
  BLOOD_PER_LEVEL: 20,
  MAX_ACTIONS_PER_MINUTE: 60,
  SUSPICIOUS_DAMAGE_THRESHOLD: 1000,
} as const;

export const ENEMY_TYPES = [
  { type: 'wolf', baseHp: 50, baseDamage: 5, xpReward: 50 },
  { type: 'vampire_hunter', baseHp: 80, baseDamage: 8, xpReward: 80 },
  { type: 'witch', baseHp: 60, baseDamage: 12, xpReward: 70 },
  { type: 'demon', baseHp: 100, baseDamage: 15, xpReward: 120 },
  { type: 'angel', baseHp: 70, baseDamage: 18, xpReward: 100 },
] as const;

export interface EnemyState {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
}
