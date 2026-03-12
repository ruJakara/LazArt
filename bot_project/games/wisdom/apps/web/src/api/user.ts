import api from './client';

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
  statPoints?: number;
}

export interface UserStats {
  strength: number;
  agility: number;
  hp: number;
  currentHp: number;
  totalKills: number;
  totalXp: number;
}

export interface UpdateSkinRequest {
  skinId: string;
}

export interface UpdateSkinResponse {
  success: boolean;
  skinId: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/user/profile');
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/user/stats');
    return response.data;
  },

  updateSkin: async (skinId: string): Promise<UpdateSkinResponse> => {
    const response = await api.put<UpdateSkinResponse>('/user/skin', { skinId });
    return response.data;
  },
};
