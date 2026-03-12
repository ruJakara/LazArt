import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

export interface UpgradeOption {
  stat: 'strength' | 'agility' | 'hp';
  currentLevel: number;
  cost: number;
  nextLevelBonus: number;
  canAfford: boolean;
  hasStatPoints: boolean;
}

export interface BuyUpgradeRequest {
  stat: 'strength' | 'agility' | 'hp';
}

export interface BuyUpgradeResponse {
  success: boolean;
  stat: string;
  newLevel: number;
  cost: number;
  message: string;
}

export const upgradeApi = {
  getOptions: async (): Promise<UpgradeOption[]> =>
    withMockApi(
      async () => {
        const response = await api.get<UpgradeOption[]>('/upgrade/options');
        return response.data;
      },
      () => mockBackend.getUpgradeOptions(),
      'core',
    ),

  buyUpgrade: async (stat: 'strength' | 'agility' | 'hp'): Promise<BuyUpgradeResponse> =>
    withMockApi(
      async () => {
        const response = await api.post<BuyUpgradeResponse>('/upgrade/buy', { stat });
        return response.data;
      },
      () => mockBackend.buyUpgrade(stat),
      'core',
    ),
};
