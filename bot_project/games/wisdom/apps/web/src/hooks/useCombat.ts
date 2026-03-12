import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useHunt } from './useHunt';

interface CombatState {
  isProcessing: boolean;
  error: string | null;
}

export function useCombat() {
  const [state, setState] = useState<CombatState>({
    isProcessing: false,
    error: null,
  });

  const { currentEnemy, addCombatLog } = useGameStore();
  const { performAction } = useHunt();

  const attack = useCallback(async () => {
    if (!currentEnemy || state.isProcessing) return;

    setState({ isProcessing: true, error: null });

    try {
      const result = await performAction('attack');
      addCombatLog(result.message);

      if (result.success) {
        addCombatLog('🏆 Враг повержен!');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      setState({ isProcessing: false, error: errorMessage });
      addCombatLog(`❌ Ошибка: ${errorMessage}`);
      return;
    }

    setState({ isProcessing: false, error: null });
  }, [currentEnemy, state.isProcessing, performAction, addCombatLog]);

  const escape = useCallback(async () => {
    if (!currentEnemy || state.isProcessing) return;

    setState({ isProcessing: true, error: null });

    try {
      const result = await performAction('escape');
      addCombatLog(result.message);

      if (result.success) {
        addCombatLog('✅ Вы сбежали!');
      } else {
        addCombatLog('⚠️ Побег не удался!');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      setState({ isProcessing: false, error: errorMessage });
      addCombatLog(`❌ Ошибка: ${errorMessage}`);
      return;
    }

    setState({ isProcessing: false, error: null });
  }, [currentEnemy, state.isProcessing, performAction, addCombatLog]);

  const feed = useCallback(async () => {
    if (!currentEnemy || state.isProcessing) return;

    setState({ isProcessing: true, error: null });

    try {
      const result = await performAction('feed');
      addCombatLog(result.message);

      if (result.success) {
        addCombatLog('💪 Вы восстановили силы!');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      setState({ isProcessing: false, error: errorMessage });
      addCombatLog(`❌ Ошибка: ${errorMessage}`);
      return;
    }

    setState({ isProcessing: false, error: null });
  }, [currentEnemy, state.isProcessing, performAction, addCombatLog]);

  return {
    ...state,
    attack,
    escape,
    feed,
  };
}
