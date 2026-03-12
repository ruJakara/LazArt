// Tests for game entities

import { Player, EnemyInstance } from '../entities';
import { ENEMY_TYPES } from '../constants';

describe('Game Entities', () => {
  describe('Player', () => {
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

    describe('getters', () => {
      it('should return level', () => {
        const player = createTestPlayer({ level: 10 });
        expect(player.level).toBe(10);
      });

      it('should return current HP', () => {
        const player = createTestPlayer({ current_hp: 50 });
        expect(player.hp).toBe(50);
      });

      it('should return max HP', () => {
        const player = createTestPlayer({ stats_hp: 150 });
        expect(player.maxHp).toBe(150);
      });
    });

    describe('isAlive', () => {
      it('should return true when HP > 0', () => {
        const player = createTestPlayer({ current_hp: 1 });
        expect(player.isAlive()).toBe(true);
      });

      it('should return false when HP = 0', () => {
        const player = createTestPlayer({ current_hp: 0 });
        expect(player.isAlive()).toBe(false);
      });
    });

    describe('takeDamage', () => {
      it('should reduce HP by damage amount', () => {
        const player = createTestPlayer({ current_hp: 100 });
        const damage = player.takeDamage(30);
        
        expect(damage).toBe(30);
        expect(player.hp).toBe(70);
      });

      it('should not reduce HP below 0', () => {
        const player = createTestPlayer({ current_hp: 50 });
        const damage = player.takeDamage(100);
        
        expect(damage).toBe(50);
        expect(player.hp).toBe(0);
        expect(player.isAlive()).toBe(false);
      });
    });

    describe('heal', () => {
      it('should increase HP by heal amount', () => {
        const player = createTestPlayer({ current_hp: 50, stats_hp: 100 });
        const healed = player.heal(30);
        
        expect(healed).toBe(30);
        expect(player.hp).toBe(80);
      });

      it('should not heal above max HP', () => {
        const player = createTestPlayer({ current_hp: 80, stats_hp: 100 });
        const healed = player.heal(50);
        
        expect(healed).toBe(20);
        expect(player.hp).toBe(100);
      });

      it('should return 0 if already at full HP', () => {
        const player = createTestPlayer({ current_hp: 100, stats_hp: 100 });
        const healed = player.heal(50);
        
        expect(healed).toBe(0);
        expect(player.hp).toBe(100);
      });
    });
  });

  describe('EnemyInstance', () => {
    describe('constructor', () => {
      it('should create wolf enemy at level 1', () => {
        const enemy = new EnemyInstance('wolf', 1);
        
        expect(enemy.type).toBe('wolf');
        expect(enemy.level).toBe(1);
        expect(enemy.maxHp).toBe(50);
        expect(enemy.hp).toBe(50);
        expect(enemy.damage).toBe(5);
      });

      it('should create demon enemy at level 5', () => {
        const enemy = new EnemyInstance('demon', 5);
        
        expect(enemy.type).toBe('demon');
        expect(enemy.level).toBe(5);
        // hp = 100 * 1.1^(5-1) = 100 * 1.4641 = 146
        expect(enemy.maxHp).toBe(146);
        // damage = 15 * 1.05^(5-1) = 15 * 1.2155 = 18
        expect(enemy.damage).toBe(18);
      });

      it('should use default enemy type for unknown type', () => {
        const enemy = new EnemyInstance('unknown_type', 1);
        
        expect(enemy.type).toBe('wolf'); // default
      });
    });

    describe('isAlive', () => {
      it('should return true when HP > 0', () => {
        const enemy = new EnemyInstance('wolf', 1);
        enemy.hp = 25;
        expect(enemy.isAlive()).toBe(true);
      });

      it('should return false when HP = 0', () => {
        const enemy = new EnemyInstance('wolf', 1);
        enemy.hp = 0;
        expect(enemy.isAlive()).toBe(false);
      });
    });

    describe('takeDamage', () => {
      it('should reduce HP by damage amount', () => {
        const enemy = new EnemyInstance('wolf', 1);
        const damage = enemy.takeDamage(20);
        
        expect(damage).toBe(20);
        expect(enemy.hp).toBe(30);
      });

      it('should not reduce HP below 0', () => {
        const enemy = new EnemyInstance('wolf', 1);
        const damage = enemy.takeDamage(100);
        
        expect(damage).toBe(50);
        expect(enemy.hp).toBe(0);
        expect(enemy.isAlive()).toBe(false);
      });
    });
  });
});
