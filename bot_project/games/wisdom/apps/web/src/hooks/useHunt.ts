import { useCallback } from 'react';
import { gameApi, GameActionType } from '../../api/game';
import { useGameStore } from '../../store/gameStore';
import { useUserStore } from '../../store/userStore';

export function useHunt() {
  const {
    startHunt: startHuntStore,
    endHunt,
    setLastHuntTime,
  } = useGameStore();

  const { updateBloodBalance, updateXp, updateLevel, updateHp } = useUserStore();

  const startHunt = useCallback(async () => {
    try {
      const response = await gameApi.startHunt();
      startHuntStore(response.enemy);
      setLastHuntTime(Date.now());
      return response;
    } catch (error) {
      console.error('Failed to start hunt:', error);
      throw error;
    }
  }, [startHuntStore, setLastHuntTime]);

  const performAction = useCallback(
    async (action: GameActionType) => {
      try {
        const response = await gameApi.performAction(action);

        // Обновление HP игрока
        updateHp(response.playerHp);

        // Обновление врага в сторе
        if (response.enemyHp >= 0) {
          useGameStore.getState().updateEnemyHp(response.enemyHp);
        }

        // Обработка результатов
        if (response.success) {
          if (response.xpGained > 0) {
            updateXp(response.xpGained);
          }
          if (response.bloodGained > 0) {
            updateBloodBalance(response.bloodGained);
          }

          // Проверка на повышение уровня (по сообщению)
          if (response.message.includes('Уровень повышен')) {
            const levelMatch = response.message.match(/Теперь (\d+)/);
            if (levelMatch) {
              updateLevel(parseInt(levelMatch[1]));
            }
          }

          // Завершение охоты при победе или побеге
          if (response.xpGained > 0 || response.escaped) {
            endHunt();
          }
        }

        // Обработка урона
        if (response.hpLost > 0) {
          // Игрок получил урон
        } else if (response.hpLost < 0) {
          // Игрок исцелился
        }

        return response;
      } catch (error) {
        console.error('Failed to perform action:', error);
        throw error;
      }
    },
    [updateBloodBalance, updateXp, updateLevel, updateHp, endHunt]
  );

  const respawn = useCallback(async () => {
    try {
      const response = await gameApi.respawn();
      if (response.success) {
        // Обновление HP после воскрешения
        const hpMatch = response.message.match(/(\d+) HP/);
        if (hpMatch) {
          updateHp(parseInt(hpMatch[1]));
        }
      }
      return response;
    } catch (error) {
      console.error('Failed to respawn:', error);
      throw error;
    }
  }, [updateHp]);

  return {
    startHunt,
    performAction,
    respawn,
  };
}
