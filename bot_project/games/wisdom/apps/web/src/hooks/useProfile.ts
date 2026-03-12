import { useEffect, useCallback } from 'react';
import { useUserStore } from '../store';
import { userApi } from '../api';

export function useProfile() {
  const { setProfile, setStats, profile, stats } = useUserStore();

  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userApi.getProfile(),
        userApi.getStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, [setProfile, setStats]);

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
