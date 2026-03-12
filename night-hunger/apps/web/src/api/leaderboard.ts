import api from './client';
import { mockBackend, withMockApi } from './mockBackend';

export type LeaderboardFilter = 'xp' | 'kills' | 'level';

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  totalXp: number;
  level: number;
  totalKills: number;
}

export interface PlayerPosition {
  rank: number;
  totalXp: number;
  totalKills: number;
  level: number;
  percentile: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
}

export const leaderboardApi = {
  getLeaderboard: async (
    limit = 50,
    offset = 0,
    filter: LeaderboardFilter = 'xp',
  ): Promise<LeaderboardResponse> =>
    withMockApi(
      async () => {
        const response = await api.get<LeaderboardResponse>('/leaderboard', {
          params: { limit, offset, filter },
        });
        return response.data;
      },
      () => mockBackend.getLeaderboard(limit, offset, filter),
      'core',
    ),

  getMyPosition: async (): Promise<PlayerPosition> =>
    withMockApi(
      async () => {
        const response = await api.get<PlayerPosition>('/leaderboard/me');
        return response.data;
      },
      () => mockBackend.getMyPosition(),
      'core',
    ),
};
