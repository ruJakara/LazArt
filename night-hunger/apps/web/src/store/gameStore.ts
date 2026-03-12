import { create } from 'zustand';
import { Enemy } from '../types';

interface GameState {
  isHunting: boolean;
  currentEnemy: Enemy | null;
  userHp: number;
  combatLog: string[];
  lastHuntTime: number | null;

  // Actions
  startHunt: (enemy: Enemy) => void;
  endHunt: () => void;
  updateUserHp: (hp: number) => void;
  updateEnemyHp: (hp: number) => void;
  addCombatLog: (message: string) => void;
  clearCombatLog: () => void;
  setLastHuntTime: (time: number) => void;
  canHunt: () => boolean;
}

const HUNT_COOLDOWN = 5000; // 5 seconds

export const useGameStore = create<GameState>((set, get) => ({
  isHunting: false,
  currentEnemy: null,
  userHp: 100,
  combatLog: [],
  lastHuntTime: null,

  startHunt: (enemy: Enemy) =>
    set({
      isHunting: true,
      currentEnemy: enemy,
      combatLog: [`⚔️ Встречен враг: ${enemy.type} (ур. ${enemy.level})`],
    }),

  endHunt: () =>
    set({
      isHunting: false,
      currentEnemy: null,
      combatLog: [],
    }),

  updateUserHp: (hp: number) => set({ userHp: Math.max(0, hp) }),

  updateEnemyHp: (hp: number) =>
    set((state) => ({
      currentEnemy: state.currentEnemy
        ? { ...state.currentEnemy, hp: Math.max(0, hp) }
        : null,
    })),

  addCombatLog: (message: string) =>
    set((state) => ({
      combatLog: [...state.combatLog, message],
    })),

  clearCombatLog: () => set({ combatLog: [] }),

  setLastHuntTime: (time: number) => set({ lastHuntTime: time }),

  canHunt: () => {
    const { lastHuntTime } = get();
    if (!lastHuntTime) return true;
    return Date.now() - lastHuntTime >= HUNT_COOLDOWN;
  },
}));
