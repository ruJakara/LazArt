import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface UserProfile {
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

interface UserStats {
  strength: number;
  agility: number;
  hp: number;
  currentHp: number;
  totalKills: number;
  totalXp: number;
}

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  stats: UserStats | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setProfile: (profile: UserProfile) => void;
  setStats: (stats: UserStats) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBloodBalance: (amount: number) => void;
  updateXp: (amount: number) => void;
  updateLevel: (level: number) => void;
  updateHp: (hp: number) => void;
  updateStatPoints: (amount: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      stats: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user: User) => set({ user }),

      setProfile: (profile: UserProfile) => set({ profile }),

      setStats: (stats: UserStats) => set({ stats }),

      logout: () =>
        set({
          user: null,
          profile: null,
          stats: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      updateBloodBalance: (amount: number) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, bloodBalance: state.profile.bloodBalance + amount }
            : null,
        })),

      updateXp: (amount: number) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, xp: state.profile.xp + amount }
            : null,
          stats: state.stats
            ? { ...state.stats, totalXp: state.stats.totalXp + amount }
            : null,
        })),

      updateLevel: (level: number) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, level } : null,
        })),

      updateHp: (hp: number) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, currentHp: hp } : null,
          stats: state.stats ? { ...state.stats, currentHp: hp } : null,
        })),

      updateStatPoints: (amount: number) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, statPoints: (state.profile.statPoints || 0) + amount }
            : null,
        })),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
