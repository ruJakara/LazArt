import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUserStore } from '../../store/userStore';
import { EnemyCard, CombatLog, ActionButtons } from '../../components/game';
import { useHunt, useCombat, useEnemy } from '../../hooks';
import { PlayerCard } from '../../components/common';

function Hunt() {
  const { isHunting, currentEnemy, combatLog, canHunt } = useGameStore();
  const { profile, stats } = useUserStore();
  const { startHunt, respawn } = useHunt();
  const { attack, escape, feed, isProcessing, error } = useCombat();
  const { isAlive, isDead, canFeed } = useEnemy();
  const [isStarting, setIsStarting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleStartHunt = async () => {
    setIsStarting(true);
    setLocalError(null);
    try {
      await startHunt();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка начала охоты');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRespawn = async () => {
    setIsStarting(true);
    setLocalError(null);
    try {
      await respawn();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка воскрешения');
    } finally {
      setIsStarting(false);
    }
  };

  // Проверка состояния игрока
  const playerHp = profile?.currentHp || 0;
  const playerMaxHp = profile?.maxHp || 100;
  const isPlayerDead = playerHp <= 0;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-bold text-red-500">🩸 Охота</h1>

      {/* Карточка игрока */}
      {profile && (
        <PlayerCard
          username={profile.username || profile.firstName || 'Игрок'}
          level={profile.level}
          currentHp={profile.currentHp}
          maxHp={profile.maxHp}
          xp={profile.xp}
          bloodBalance={profile.bloodBalance}
        />
      )}

      {/* Ошибка */}
      {(localError || error) && (
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 w-full max-w-sm">
          <p className="text-red-300 text-sm">
            ❌ {localError || error}
          </p>
        </div>
      )}

      {/* Состояние охоты */}
      {!isHunting && !isPlayerDead && (
        <div className="text-center">
          <p className="text-gray-400 mb-4">Вы находитесь в безопасной зоне</p>
          <button
            onClick={handleStartHunt}
            disabled={isStarting || !canHunt()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95"
          >
            {isStarting ? '⏳ Начало...' : '🔍 Начать охоту'}
          </button>
          {!canHunt() && (
            <p className="text-gray-500 text-xs mt-2">
              Подождите перед следующей охотой
            </p>
          )}
        </div>
      )}

      {/* Игрок мертв */}
      {isPlayerDead && (
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-gray-400 mb-4">Вы погибли в бою...</p>
          <button
            onClick={handleRespawn}
            disabled={isStarting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95"
          >
            {isStarting ? '⏳ Воскрешение...' : '🔄 Воскреснуть'}
          </button>
        </div>
      )}

      {/* Активная охота */}
      {isHunting && currentEnemy && (
        <>
          <EnemyCard enemy={currentEnemy} />

          <CombatLog logs={combatLog} />

          <ActionButtons
            onAttack={attack}
            onEscape={escape}
            onFeed={feed}
            canFeed={canFeed}
            isLoading={isProcessing}
          />
        </>
      )}
    </div>
  );
}

export default Hunt;
