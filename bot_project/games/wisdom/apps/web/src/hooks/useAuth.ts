import { useCallback } from 'react';
import { useUserStore } from '../store';
import { authApi } from '../api';

export function useAuth() {
  const { setTokens, setUser, logout, setLoading, setError } = useUserStore();

  const login = useCallback(
    async (initData: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authApi.validateInitData(initData);
        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);

        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to login';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setTokens, setUser, setLoading, setError]
  );

  const logoutUser = useCallback(() => {
    logout();
  }, [logout]);

  return {
    login,
    logout: logoutUser,
    isAuthenticated: useUserStore((state) => state.isAuthenticated),
    user: useUserStore((state) => state.user),
    isLoading: useUserStore((state) => state.isLoading),
    error: useUserStore((state) => state.error),
  };
}
