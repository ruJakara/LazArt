import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useAuth } from '../hooks';

interface TelegramInitProps {
  children: React.ReactNode;
}

export function TelegramInit({ children }: TelegramInitProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize Telegram WebApp
    WebApp.ready();
    WebApp.expand();

    // Enable closing confirmation
    WebApp.enableClosingConfirmation();

    // Set header color
    WebApp.setHeaderColor('#1a1a1a');

    // Get initData and login
    const initData = WebApp.initData;

    if (initData && !isAuthenticated) {
      login(initData)
        .then(() => {
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error('Failed to login with Telegram:', error);
          // For development without Telegram, allow continue
          setIsInitialized(true);
        });
    } else {
      setIsInitialized(true);
    }
  }, [isAuthenticated, login]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
