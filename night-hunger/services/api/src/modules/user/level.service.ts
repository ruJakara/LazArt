import { Injectable } from '@nestjs/common';

/**
 * Система уровней и опыта
 * 
 * Формула XP для уровня: 100 * (Level ^ 1.5)
 * Награда за уровень: +3 stat points
 */

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

@Injectable()
export class LevelService {
  /**
   * Базовый множитель для формулы XP
   */
  private readonly BASE_XP = 100;

  /**
   * Очки характеристик за уровень
   */
  private readonly STAT_POINTS_PER_LEVEL = 3;

  /**
   * Рассчитать необходимое количество XP для уровня
   * Формула: 100 * (Level ^ 1.5)
   */
  getXpForLevel(level: number): number {
    if (level < 1) return 0;
    return Math.floor(this.BASE_XP * Math.pow(level, 1.5));
  }

  /**
   * Рассчитать общий накопленный XP для достижения уровня
   */
  getTotalXpForLevel(level: number): number {
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
      totalXp += this.getXpForLevel(i);
    }
    return totalXp;
  }

  /**
   * Определить уровень по общему XP
   */
  getLevelFromTotalXp(totalXp: number): number {
    let level = 1;
    let accumulatedXp = 0;

    while (true) {
      const xpNeeded = this.getXpForLevel(level);
      if (accumulatedXp + xpNeeded > totalXp) {
        return level;
      }
      accumulatedXp += xpNeeded;
      level++;
    }
  }

  /**
   * Проверить и вернуть новый уровень
   * Возвращает количество полученных уровней
   */
  checkLevelUp(currentLevel: number, currentXp: number): {
    newLevel: number;
    levelsGained: number;
  } {
    const newLevel = this.getLevelFromTotalXp(currentXp);
    return {
      newLevel,
      levelsGained: Math.max(0, newLevel - currentLevel),
    };
  }

  /**
   * Получить информацию о прогрессе уровня
   */
  getLevelInfo(currentXp: number, currentLevel: number): LevelInfo {
    const xpForCurrent = this.getTotalXpForLevel(currentLevel);
    const xpForNext = this.getTotalXpForLevel(currentLevel + 1);
    const totalForCurrentLevel = this.getXpForLevel(currentLevel);
    
    const progressInCurrentLevel = currentXp - xpForCurrent;
    const progressPercent = totalForCurrentLevel > 0
      ? Math.min(100, Math.floor((progressInCurrentLevel / totalForCurrentLevel) * 100))
      : 0;

    return {
      level: currentLevel,
      currentXp,
      xpForCurrentLevel: totalForCurrentLevel,
      xpForNextLevel: this.getXpForLevel(currentLevel + 1),
      progressPercent,
    };
  }

  /**
   * Получить количество stat points за уровни
   */
  getStatPointsForLevels(levels: number): number {
    return this.STAT_POINTS_PER_LEVEL * levels;
  }
}
