// Game rules

import { Player, EnemyInstance } from '../entities';
import { calculateDamage, calculateEscapeChance, calculateFeedAmount } from '../formulas';

export interface CombatResult {
  success: boolean;
  xpGained: number;
  bloodGained: number;
  hpLost: number;
  escaped: boolean;
}

export function performAttack(player: Player, enemy: EnemyInstance, strength: number): CombatResult {
  const playerDamage = calculateDamage(strength, 0);
  enemy.takeDamage(playerDamage);
  
  let hpLost = 0;
  
  if (enemy.isAlive()) {
    hpLost = player.takeDamage(enemy.damage);
  }
  
  const success = !enemy.isAlive();
  const xpGained = success ? enemy.level * 50 : 0;
  const bloodGained = success ? enemy.level * 20 : 0;
  
  return { success, xpGained, bloodGained, hpLost, escaped: false };
}

export function performEscape(player: Player, enemy: EnemyInstance, agility: number): CombatResult {
  const chance = calculateEscapeChance(agility, enemy.level * 5);
  const success = Math.random() * 100 <= chance;
  
  let hpLost = 0;
  
  if (!success) {
    hpLost = player.takeDamage(enemy.damage);
  }
  
  return { 
    success, 
    xpGained: 0, 
    bloodGained: 0, 
    hpLost, 
    escaped: success 
  };
}

export function performFeed(player: Player, enemy: EnemyInstance): CombatResult {
  if (!enemy.isAlive()) {
    const healed = player.heal(calculateFeedAmount(enemy.level));
    return { 
      success: true, 
      xpGained: enemy.level * 10, 
      bloodGained: 0, 
      hpLost: -healed,
      escaped: false 
    };
  }
  
  return { success: false, xpGained: 0, bloodGained: 0, hpLost: 0, escaped: false };
}
