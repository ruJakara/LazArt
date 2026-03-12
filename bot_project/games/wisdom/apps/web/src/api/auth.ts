import api from './client';

export interface ValidateInitDataResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  validateInitData: async (initData: string): Promise<ValidateInitDataResponse> => {
    const response = await api.post<ValidateInitDataResponse>('/auth/validate', {
      initData,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
