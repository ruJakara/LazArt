import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks';
import { PlayerCard, MenuItem, TelegramInit } from '../../components/common';

const MENU_ITEMS = [
  { id: 'hunt', label: '🩸 Охота', path: '/hunt', color: 'bg-red-600', icon: '⚔️' },
  { id: 'upgrade', label: '⚡ Прокачка', path: '/upgrade', color: 'bg-blue-600', icon: '📈' },
  { id: 'inventory', label: '🎒 Инвентарь', path: '/inventory', color: 'bg-purple-600', icon: '🎒' },
  { id: 'shop', label: '🏪 Магазин', path: '/shop', color: 'bg-green-600', icon: '🛒' },
  { id: 'leaderboard', label: '🏆 Лидеры', path: '/leaderboard', color: 'bg-yellow-600', icon: '👑' },
] as const;

function HubContent() {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();

  // Мемоизация обработчиков навигации
  const handleNavigate = useMemo(
    () => (path: string) => navigate(path),
    [navigate]
  );

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-red-500">Night Hunger</h1>
        <p className="text-gray-400">Vampire Evo</p>
      </div>

      <PlayerCard
        username={profile.username || profile.firstName || 'Игрок'}
        level={profile.level}
        currentHp={profile.currentHp}
        maxHp={profile.maxHp}
        xp={profile.xp}
        bloodBalance={profile.bloodBalance}
      />

      <div className="w-full max-w-sm space-y-3 mt-4">
        {MENU_ITEMS.map((item) => (
          <MenuItem
            key={item.id}
            label={item.label}
            path={item.path}
            color={item.color}
            icon={item.icon}
            onClick={() => handleNavigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
}

export const Hub = memo(function Hub() {
  return (
    <TelegramInit>
      <HubContent />
    </TelegramInit>
  );
});
