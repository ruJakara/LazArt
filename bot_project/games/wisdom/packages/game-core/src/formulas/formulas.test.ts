// Tests for game core formulas

import {
  calculateDamage,
  calculateEscapeChance,
  getXpForLevel,
  getUpgradeCost,
  calculateFeedAmount,
  calculateEnemyStats,
} from './formulas';
import { GAME_CONFIG, ENEMY_TYPES } from '../constants';

describe('Game Core Formulas', () => {
  describe('calculateDamage', () => {
    it('should calculate damage correctly', () => {
      // damage = strength * 1.5 - armor
      expect(calculateDamage(10, 0)).toBe(15); // 10 * 1.5 = 15
      expect(calculateDamage(10, 5)).toBe(10); // 10 * 1.5 - 5 = 10
      expect(calculateDamage(20, 10)).toBe(20); // 20 * 1.5 - 10 = 20
    });

    it('should not return damage less than MIN_DAMAGE', () => {
      expect(calculateDamage(1, 100)).toBe(GAME_CONFIG.MIN_DAMAGE);
    });

    it('should handle zero strength', () => {
      expect(calculateDamage(0, 0)).toBe(GAME_CONFIG.MIN_DAMAGE);
    });
  });

  describe('calculateEscapeChance', () => {
    it('should calculate escape chance correctly', () => {
      // chance = (userAgility / enemyAgility) * 100
      expect(calculateEscapeChance(10, 10)).toBe(100); // 100%
      expect(calculateEscapeChance(5, 10)).toBe(50); // 50%
      expect(calculateEscapeChance(15, 10)).toBe(100); // capped at 100
    });

    it('should respect MIN_ESCAPE_CHANCE', () => {
      expect(calculateEscapeChance(1, 100)).toBe(GAME_CONFIG.MIN_ESCAPE_CHANCE);
    });

    it('should respect MAX_ESCAPE_CHANCE', () => {
      expect(calculateEscapeChance(100, 1)).toBe(GAME_CONFIG.MAX_ESCAPE_CHANCE);
    });
  });

  describe('getXpForLevel', () => {
    it('should calculate XP for level 1', () => {
      // 100 * (1 ^ 1.5) = 100
      expect(getXpForLevel(1)).toBe(100);
    });

    it('should calculate XP for level 5', () => {
      // 100 * (5 ^ 1.5) = 100 * 11.18 = 1118
      expect(getXpForLevel(5)).toBeCloseTo(1118, 0);
    });

    it('should calculate XP for level 10', () => {
      // 100 * (10 ^ 1.5) = 100 * 31.62 = 3162
      expect(getXpForLevel(10)).toBeCloseTo(3162, 0);
    });

    it('should increase exponentially', () => {
      const xp1 = getXpForLevel(1);
      const xp5 = getXpForLevel(5);
      const xp10 = getXpForLevel(10);
      
      expect(xp5).toBeGreaterThan(xp1);
      expect(xp10).toBeGreaterThan(xp5);
    });
  });

  describe('getUpgradeCost', () => {
    it('should calculate upgrade cost correctly', () => {
      // cost = 100 * level
      expect(getUpgradeCost(1)).toBe(100);
      expect(getUpgradeCost(5)).toBe(500);
      expect(getUpgradeCost(10)).toBe(1000);
    });

    it('should handle level 0', () => {
      expect(getUpgradeCost(0)).toBe(0);
    });
  });

  describe('calculateFeedAmount', () => {
    it('should calculate feed amount based on victim level', () => {
      // heal = 10 * victimLevel
      expect(calculateFeedAmount(1)).toBe(10);
      expect(calculateFeedAmount(5)).toBe(50);
      expect(calculateFeedAmount(10)).toBe(100);
    });

    it('should handle level 0', () => {
      expect(calculateFeedAmount(0)).toBe(0);
    });
  });

  describe('calculateEnemyStats', () => {
    const wolfType = ENEMY_TYPES.find(e => e.type === 'wolf')!;

    it('should calculate enemy HP correctly', () => {
      // hp = baseHp * 1.1^(level-1)
      const level1Stats = calculateEnemyStats(wolfType, 1);
      expect(level1Stats.hp).toBe(50); // 50 * 1.1^0 = 50

      const level2Stats = calculateEnemyStats(wolfType, 2);
      expect(level2Stats.hp).toBe(55); // 50 * 1.1^1 = 55
    });

    it('should calculate enemy damage correctly', () => {
      // damage = baseDamage * 1.05^(level-1)
      const level1Stats = calculateEnemyStats(wolfType, 1);
      expect(level1Stats.damage).toBe(5); // 5 * 1.05^0 = 5

      const level2Stats = calculateEnemyStats(wolfType, 2);
      expect(level2Stats.damage).toBe(5); // 5 * 1.05^1 = 5.25 -> floor = 5
    });

    it('should scale with level', () => {
      const level1Stats = calculateEnemyStats(wolfType, 1);
      const level10Stats = calculateEnemyStats(wolfType, 10);

      expect(level10Stats.hp).toBeGreaterThan(level1Stats.hp);
      expect(level10Stats.damage).toBeGreaterThan(level1Stats.damage);
    });
  });
});
