// Game core formulas

import { GAME_CONFIG } from '../constants';

export function calculateDamage(strength: number, enemyArmor: number): number {
  const damage = strength * 1.5 - enemyArmor;
  return Math.max(GAME_CONFIG.MIN_DAMAGE, Math.floor(damage));
}

export function calculateEscapeChance(userAgility: number, enemyAgility: number): number {
  const chance = (userAgility / enemyAgility) * 100;
  return Math.min(
    GAME_CONFIG.MAX_ESCAPE_CHANCE,
    Math.max(GAME_CONFIG.MIN_ESCAPE_CHANCE, Math.floor(chance))
  );
}

export function getXpForLevel(level: number): number {
  return Math.floor(GAME_CONFIG.BASE_XP * Math.pow(level, GAME_CONFIG.XP_MULTIPLIER));
}

export function getUpgradeCost(currentLevel: number): number {
  return GAME_CONFIG.BASE_UPGRADE_COST * currentLevel;
}

export function calculateFeedAmount(victimLevel: number): number {
  const baseHeal = 10;
  return baseHeal * victimLevel;
}

export function calculateEnemyStats(enemyType: { baseHp: number; baseDamage: number }, level: number) {
  return {
    hp: Math.floor(enemyType.baseHp * Math.pow(1.1, level - 1)),
    damage: Math.floor(enemyType.baseDamage * Math.pow(1.05, level - 1)),
  };
}
