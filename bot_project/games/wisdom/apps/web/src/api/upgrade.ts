import api from './client';

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
  getOptions: async (): Promise<UpgradeOption[]> => {
    const response = await api.get<UpgradeOption[]>('/upgrade/options');
    return response.data;
  },

  buyUpgrade: async (stat: 'strength' | 'agility' | 'hp'): Promise<BuyUpgradeResponse> => {
    const response = await api.post<BuyUpgradeResponse>('/upgrade/buy', { stat });
    return response.data;
  },
};
