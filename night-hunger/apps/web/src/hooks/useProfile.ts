import { useEffect, useCallback } from 'react';
import { useUserStore } from '../store';
import { userApi } from '../api';
import { getApiErrorMessage } from '../api/error';

export function useProfile() {
  const { setProfile, setStats, profile, stats, setError } = useUserStore();

  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userApi.getProfile(),
        userApi.getStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setError(null);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Не удалось загрузить профиль');
      setError(message);
      console.error('Failed to fetch profile:', message);
    }
  }, [setProfile, setStats, setError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    stats,
    isLoading: !profile && !stats,
    refetch: fetchProfile,
  };
}
