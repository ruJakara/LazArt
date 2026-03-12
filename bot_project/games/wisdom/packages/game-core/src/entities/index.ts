// Game entities

import { Enemy, UserState } from '@shared/types';
import { calculateEnemyStats } from '../formulas';
import { ENEMY_TYPES } from '@shared/constants';

export class Player {
  constructor(public state: UserState) {}

  get level(): number {
    return this.state.level;
  }

  get hp(): number {
    return this.state.currentHp;
  }

  get maxHp(): number {
    return this.state.maxHp;
  }

  isAlive(): boolean {
    return this.state.currentHp > 0;
  }

  takeDamage(amount: number): number {
    const actualDamage = amount;
    this.state.currentHp = Math.max(0, this.state.currentHp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.state.maxHp - this.state.currentHp);
    this.state.currentHp += actualHeal;
    return actualHeal;
  }
}

export class EnemyInstance implements Enemy {
  type: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;

  constructor(type: string, level: number) {
    const enemyType = ENEMY_TYPES.find(e => e.type === type) || ENEMY_TYPES[0];
    const stats = calculateEnemyStats(enemyType, level);
    
    this.type = type;
    this.level = level;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(amount: number): number {
    const actualDamage = amount;
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }
}
