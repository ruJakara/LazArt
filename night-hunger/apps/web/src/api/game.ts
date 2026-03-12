import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

export interface Enemy {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
}

export interface StartHuntResponse {
  enemy: Enemy;
  canEscape: boolean;
  canAttack: boolean;
}

export type GameActionType = 'attack' | 'escape' | 'feed';

export interface GameActionRequest {
  action: GameActionType;
}

export interface GameActionResponse {
  success: boolean;
  xpGained: number;
  bloodGained: number;
  hpLost: number;
  playerHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  escaped: boolean;
  message: string;
}

export interface GameState {
  user: {
    id: number;
    level: number;
    xp: number;
    bloodBalance: number;
    currentHp: number;
    maxHp: number;
  };
  currentHunt: {
    enemy: Enemy;
    userHp: number;
  } | null;
}

export interface RespawnResponse {
  success: boolean;
  message: string;
}

export const gameApi = {
  startHunt: async (): Promise<StartHuntResponse> =>
    withMockApi(
      async () => {
        const response = await api.get<StartHuntResponse>('/game/hunt');
        return response.data;
      },
      () => mockBackend.startHunt(),
      'core',
    ),

  performAction: async (action: GameActionType): Promise<GameActionResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<GameActionResponse>('/game/action', { action });
        return response.data;
      },
      () => mockBackend.performAction(action),
      'core',
    ),

  getGameState: async (): Promise<GameState> =>
    withMockApi(
      async () => {
        const response = await api.get<GameState>('/game/state');
        return response.data;
      },
      () => mockBackend.getGameState(),
      'core',
    ),

  respawn: async (): Promise<RespawnResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<RespawnResponse>('/game/respawn');
        return response.data;
      },
      () => mockBackend.respawn(),
      'core',
    ),
};
