// Shared types and constants

export interface User {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface GameState {
  user: UserState;
  currentHunt: HuntState | null;
}

export interface UserState {
  id: number;
  level: number;
  xp: number;
  bloodBalance: number;
  currentHp: number;
  maxHp: number;
  skinId: string;
}

export interface HuntState {
  enemy: Enemy;
  userHp: number;
}

export interface Enemy {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
}

export type GameAction = 'attack' | 'escape' | 'feed';

export interface UpgradeOption {
  stat: 'strength' | 'agility' | 'hp';
  currentLevel: number;
  cost: number;
}

export interface InventoryItem {
  itemId: string;
  itemType: 'skin' | 'potion' | 'boost';
  quantity: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  totalXp: number;
  totalKills?: number;
}
