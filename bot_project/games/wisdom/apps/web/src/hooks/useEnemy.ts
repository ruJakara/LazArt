import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export function useEnemy() {
  const { currentEnemy, isHunting } = useGameStore();

  const isAlive = useMemo(() => {
    return currentEnemy ? currentEnemy.hp > 0 : false;
  }, [currentEnemy]);

  const isDead = useMemo(() => {
    return currentEnemy ? currentEnemy.hp <= 0 : false;
  }, [currentEnemy]);

  const hpPercentage = useMemo(() => {
    if (!currentEnemy) return 0;
    return (currentEnemy.hp / currentEnemy.maxHp) * 100;
  }, [currentEnemy]);

  const canFeed = useMemo(() => {
    return isDead;
  }, [isDead]);

  return {
    currentEnemy,
    isHunting,
    isAlive,
    isDead,
    hpPercentage,
    canFeed,
  };
}
