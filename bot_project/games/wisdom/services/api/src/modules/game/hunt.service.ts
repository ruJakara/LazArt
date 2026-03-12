import { Injectable } from '@nestjs/common';
import { ENEMY_TYPES } from '@packages/shared/constants';
import { Enemy } from '@packages/shared/types';

@Injectable()
export class HuntService {
  /**
   * Генерация случайного врага на основе уровня игрока
   */
  findEnemy(userLevel: number): Enemy {
    // Определяем доступные типы врагов на основе уровня игрока
    const availableEnemies = ENEMY_TYPES.filter((enemy) => {
      // Базовая логика: волки доступны с 1 уровня, охотники с 3, ведьмы с 5 и т.д.
      const minLevelForEnemy = this.getMinLevelForEnemy(enemy.type);
      return userLevel >= minLevelForEnemy;
    });

    // Если нет доступных врагов, используем первого доступного
    const enemiesToChoose = availableEnemies.length > 0 ? availableEnemies : ENEMY_TYPES.slice(0, 1);

    // Выбираем случайного врага
    const enemyType = enemiesToChoose[Math.floor(Math.random() * enemiesToChoose.length)];

    // Вычисляем уровень врага (±2 от уровня игрока)
    const enemyLevel = this.calculateEnemyLevel(userLevel);

    // Рассчитываем статы врага
    const stats = this.calculateEnemyStats(enemyType, enemyLevel);

    return {
      type: enemyType.type,
      level: enemyLevel,
      hp: stats.hp,
      maxHp: stats.hp,
      damage: stats.damage,
    };
  }

  /**
   * Минимальный уровень игрока для встречи с данным типом врага
   */
  private getMinLevelForEnemy(enemyType: string): number {
    const minLevels: Record<string, number> = {
      wolf: 1,
      vampire_hunter: 3,
      witch: 5,
      demon: 8,
      angel: 10,
    };
    return minLevels[enemyType] || 1;
  }

  /**
   * Расчет уровня врага с рандомизацией
   */
  private calculateEnemyLevel(userLevel: number): number {
    const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
    return Math.max(1, userLevel + variance);
  }

  /**
   * Расчет статов врага на основе уровня
   * Формула: base * (1.1 ^ (level - 1))
   */
  private calculateEnemyStats(enemyType: (typeof ENEMY_TYPES)[0], level: number) {
    const hpMultiplier = Math.pow(1.1, level - 1);
    const damageMultiplier = Math.pow(1.05, level - 1);

    return {
      hp: Math.floor(enemyType.baseHp * hpMultiplier),
      damage: Math.floor(enemyType.baseDamage * damageMultiplier),
    };
  }

  /**
   * Расчет награды за победу
   */
  calculateRewards(enemyLevel: number): { xp: number; blood: number } {
    const baseXp = 50;
    const baseBlood = 20;

    return {
      xp: baseXp * enemyLevel,
      blood: baseBlood * enemyLevel,
    };
  }
}
