import { Injectable } from '@nestjs/common';
import {
  calculateDamage,
  calculateEscapeChance,
  calculateFeedAmount,
} from '@packages/game-core/formulas';

@Injectable()
export class CombatService {
  /**
   * Расчет урона игрока
   */
  calcDamage(strength: number, enemyArmor: number = 0): number {
    return calculateDamage(strength, enemyArmor);
  }

  /**
   * Расчет шанса побега
   */
  calcEscapeChance(userAgility: number, enemyAgility: number): number {
    return calculateEscapeChance(userAgility, enemyAgility);
  }

  /**
   * Расчет количества исцеления при поглощении
   */
  calcFeedAmount(victimLevel: number): number {
    return calculateFeedAmount(victimLevel);
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
