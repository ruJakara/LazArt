import { Injectable } from '@nestjs/common';
import { GAME_CONFIG } from '../../config/game.constants';

@Injectable()
export class CombatService {
  /**
   * Расчет урона игрока
   */
  calcDamage(strength: number, enemyArmor: number = 0): number {
    const damage = strength * 1.5 - enemyArmor;
    return Math.max(GAME_CONFIG.MIN_DAMAGE, Math.floor(damage));
  }

  /**
   * Расчет шанса побега
   */
  calcEscapeChance(userAgility: number, enemyAgility: number): number {
    const rawChance = (userAgility / Math.max(1, enemyAgility)) * 100;
    return Math.min(
      GAME_CONFIG.MAX_ESCAPE_CHANCE,
      Math.max(GAME_CONFIG.MIN_ESCAPE_CHANCE, Math.floor(rawChance)),
    );
  }

  /**
   * Расчет количества исцеления при поглощении
   */
  calcFeedAmount(victimLevel: number): number {
    const baseHeal = 10;
    return baseHeal * Math.max(1, victimLevel);
  }

  /**
   * Проверка успеха побега
   */
  checkEscapeSuccess(userAgility: number, enemyLevel: number): boolean {
    // Enemy agility scales with level
    const enemyAgility = enemyLevel * 5;
    const chance = this.calcEscapeChance(userAgility, enemyAgility);
    const roll = Math.random() * 100;
    return roll <= chance;
  }
}
