import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

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
    return withMockApi(
      async () => {
        const response = await api.post<ValidateInitDataResponse>('/auth/validate', {
          initData,
        });
        return response.data;
      },
      () => mockBackend.validateInitData(initData),
      'core',
    );
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return withMockApi(
      async () => {
        const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
          refreshToken,
        });
        return response.data;
      },
      () => mockBackend.refreshToken(),
      'core',
    );
  },

  getMe: async () =>
    withMockApi(
      async () => {
        const response = await api.get('/auth/me');
        return response.data;
      },
      async () => {
        const profile = await mockBackend.getProfile();
        return {
          id: profile.id,
          username: profile.username,
          firstName: profile.firstName,
          lastName: profile.lastName,
        };
      },
      'core',
    ),
};
