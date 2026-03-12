import { memo, useMemo } from 'react';
import { ProgressBar } from './ProgressBar';

interface PlayerCardProps {
  username: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
  xp: number;
  bloodBalance: number;
}

export const PlayerCard = memo(function PlayerCard({
  username,
  level,
  currentHp,
  maxHp,
  xp,
  bloodBalance,
}: PlayerCardProps) {
  // Мемоизация вычислений
  const xpForNextLevel = useMemo(
    () => 100 * Math.pow(level, 1.5),
    [level]
  );

  return (
    <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-xl font-bold">
            {level}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {username || 'Игрок'}
            </h3>
            <p className="text-gray-400 text-sm">Уровень {level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-red-400 font-semibold">🩸 {bloodBalance}</p>
          <p className="text-blue-400 text-sm">✨ {xp} XP</p>
        </div>
      </div>

      <div className="space-y-2">
        <ProgressBar
          value={currentHp}
          max={maxHp}
          color="bg-green-500"
          label="❤️ Здоровье"
        />
        <ProgressBar
          value={xp}
          max={Math.floor(xpForNextLevel)}
          color="bg-blue-500"
          label="⭐ Опыт"
        />
      </div>
    </div>
  );
});
