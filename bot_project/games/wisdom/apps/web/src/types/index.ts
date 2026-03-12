export interface Enemy {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
}

export interface User {
  id: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface UserProfile {
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
}

export interface UserStats {
  strength: number;
  agility: number;
  hp: number;
  currentHp: number;
  totalKills: number;
  totalXp: number;
}

export type GameAction = 'attack' | 'escape' | 'feed';
