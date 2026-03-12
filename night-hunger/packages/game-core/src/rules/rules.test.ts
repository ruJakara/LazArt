// Tests for combat rules

import { Player, EnemyInstance } from '../entities';
import {
  performAttack,
  performEscape,
  performFeed,
  CombatResult,
} from './rules';

describe('Combat Rules', () => {
  const createTestPlayer = (overrides = {}) => {
    const defaultState = {
      id: 123n,
      username: 'test_player',
      first_name: 'Test',
      last_name: null,
      language_code: 'ru',
      blood_balance: 100,
      xp: 500,
      level: 5,
      stats_strength: 10,
      stats_agility: 10,
      stats_hp: 100,
      current_hp: 80,
      stat_points: 0,
      skin_id: 'default',
      is_premium: false,
      premium_expires_at: null,
      referral_code: 'test123',
      referred_by: null,
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
    return new Player(defaultState);
  };

  describe('performAttack', () => {
    it('should player defeat enemy in one hit', () => {
      const player = createTestPlayer({ stats_strength: 100 });
      const enemy = new EnemyInstance('wolf', 1); // 50 HP

      const result: CombatResult = performAttack(player, enemy, 100);

      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(50); // level 1 * 50
      expect(result.bloodGained).toBe(20); // level 1 * 20
      expect(result.escaped).toBe(false);
      expect(enemy.isAlive()).toBe(false);
    });

    it('should enemy survive and counter-attack', () => {
      const player = createTestPlayer({ stats_strength: 5, current_hp: 100 });
      const enemy = new EnemyInstance('wolf', 1); // 5 damage

      const result: CombatResult = performAttack(player, enemy, 5);

      expect(result.success).toBe(false);
      expect(result.xpGained).toBe(0);
      expect(result.hpLost).toBe(5); // enemy damage
      expect(player.hp).toBe(95);
      expect(enemy.isAlive()).toBe(true);
    });

    it('should player die from counter-attack', () => {
      const player = createTestPlayer({ stats_strength: 10, current_hp: 5 });
      const enemy = new EnemyInstance('demon', 5); // high damage

      performAttack(player, enemy, 10);

      expect(player.isAlive()).toBe(false);
    });
  });

  describe('performEscape', () => {
    it('should successfully escape with high agility', () => {
      const player = createTestPlayer({ stats_agility: 100 });
      const enemy = new EnemyInstance('wolf', 1);

      // Mock Math.random for consistent test
      const originalRandom = Math.random;
      Math.random = () => 0.5; // 50% chance

      const result: CombatResult = performEscape(player, enemy, 100);

      Math.random = originalRandom;

      expect(result.success).toBe(true);
      expect(result.escaped).toBe(true);
      expect(result.hpLost).toBe(0);
    });

    it('should fail to escape with low agility', () => {
      const player = createTestPlayer({ stats_agility: 1, current_hp: 100 });
      const enemy = new EnemyInstance('wolf', 10);

      const result: CombatResult = performEscape(player, enemy, 1);

      expect(result.success).toBe(false);
      expect(result.escaped).toBe(false);
      expect(result.hpLost).toBeGreaterThan(0);
      expect(player.hp).toBeLessThan(100);
    });

    it('should take damage on failed escape', () => {
      const player = createTestPlayer({ stats_agility: 5, current_hp: 80 });
      const enemy = new EnemyInstance('wolf', 5);

      performEscape(player, enemy, 5);

      expect(player.hp).toBeLessThanOrEqual(80);
    });
  });

  describe('performFeed', () => {
    it('should heal player after feeding on dead enemy', () => {
      const player = createTestPlayer({ current_hp: 50, stats_hp: 100 });
      const enemy = new EnemyInstance('wolf', 1);
      enemy.hp = 0; // Enemy is dead

      const result: CombatResult = performFeed(player, enemy);

      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(10); // level 1 * 10
      expect(result.hpLost).toBeLessThan(0); // Negative = healing
      expect(player.hp).toBeGreaterThan(50);
    });

    it('should fail to feed on living enemy', () => {
      const player = createTestPlayer({ current_hp: 50 });
      const enemy = new EnemyInstance('wolf', 1);
      enemy.hp = 30; // Enemy is alive

      const result: CombatResult = performFeed(player, enemy);

      expect(result.success).toBe(false);
      expect(result.xpGained).toBe(0);
      expect(player.hp).toBe(50); // No change
    });

    it('should not heal above max HP', () => {
      const player = createTestPlayer({ current_hp: 90, stats_hp: 100 });
      const enemy = new EnemyInstance('wolf', 10);
      enemy.hp = 0; // Enemy is dead

      performFeed(player, enemy);

      expect(player.hp).toBe(100); // Capped at max
    });
  });

  describe('Combat flow', () => {
    it('should complete combat sequence: attack -> feed', () => {
      const player = createTestPlayer({
        stats_strength: 20,
        current_hp: 100,
        stats_hp: 100,
      });
      const enemy = new EnemyInstance('wolf', 1);

      // First attack
      const attackResult: CombatResult = performAttack(player, enemy, 20);
      
      // Enemy should be dead
      expect(enemy.isAlive()).toBe(false);

      // Feed on dead enemy
      const feedResult: CombatResult = performFeed(player, enemy);
      
      expect(feedResult.success).toBe(true);
      expect(player.hp).toBeLessThanOrEqual(100);
    });

    it('should complete combat sequence: escape', () => {
      const player = createTestPlayer({
        stats_agility: 50,
        current_hp: 100,
      });
      const enemy = new EnemyInstance('wolf', 1);

      const result: CombatResult = performEscape(player, enemy, 50);

      expect(result.escaped).toBe(true);
      expect(enemy.isAlive()).toBe(true); // Enemy still alive
    });
  });
});
