import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';

export interface UpgradeOption {
  stat: string;
  currentLevel: number;
  cost: number;
  nextLevelBonus: number;
  canAfford: boolean;
  hasStatPoints: boolean;
}

@Injectable()
export class UpgradeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Формула стоимости: 100 * Level
   */
  getUpgradeCost(currentLevel: number): number {
    const BASE_COST = 100;
    return BASE_COST * currentLevel;
  }

  /**
   * Получить доступные улучшения для игрока
   */
  async getUpgradeOptions(userId: string): Promise<UpgradeOption[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = [
      { 
        key: 'strength' as const, 
        label: 'Сила', 
        value: user.stats_strength,
        icon: '💪'
      },
      { 
        key: 'agility' as const, 
        label: 'Ловкость', 
        value: user.stats_agility,
        icon: '⚡'
      },
      { 
        key: 'hp' as const, 
        label: 'Здоровье', 
        value: user.stats_hp,
        icon: '❤️'
      },
    ];

    return stats.map((stat) => {
      const cost = this.getUpgradeCost(stat.value);
      return {
        stat: stat.key,
        currentLevel: stat.value,
        cost,
        nextLevelBonus: stat.key === 'hp' ? 10 : 1, // +10 HP или +1 stat
        canAfford: user.blood_balance >= cost,
        hasStatPoints: user.stat_points > 0,
      };
    });
  }

  /**
   * Купить улучшение
   * Требования:
   * 1. Достаточно крови (blood_balance >= cost)
   * 2. Есть очки характеристик (stat_points > 0)
   */
  async buyUpgrade(userId: string, dto: BuyUpgradeDto): Promise<{
    success: boolean;
    stat: string;
    newLevel: number;
    cost: number;
    message: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cost = this.getUpgradeCost(this.getCurrentStatLevel(user, dto.stat));

    // Проверка: достаточно ли крови
    if (user.blood_balance < cost) {
      throw new BadRequestException(`Недостаточно крови. Нужно: ${cost}, есть: ${user.blood_balance}`);
    }

    // Проверка: есть ли очки характеристик
    if (user.stat_points <= 0) {
      throw new BadRequestException('Нет доступных очков характеристик. Повысьте уровень.');
    }

    // Списываем кровь и очки характеристик
    user.blood_balance -= cost;
    user.stat_points -= 1;

    // Повышаем характеристику
    this.incrementStat(user, dto.stat);

    await this.userRepository.save(user);

    return {
      success: true,
      stat: dto.stat,
      newLevel: this.getCurrentStatLevel(user, dto.stat),
      cost,
      message: `Улучшено: ${this.getStatName(dto.stat)} (+${dto.stat === 'hp' ? 10 : 1})`,
    };
  }

  /**
   * Начислить очки характеристик за уровень
   * Формула: +3 stat points за каждый уровень
   */
  async awardStatPoints(userId: string, levelsGained: number): Promise<void> {
    const POINTS_PER_LEVEL = 3;
    await this.userRepository.increment(
      { id: userId },
      'stat_points',
      POINTS_PER_LEVEL * levelsGained,
    );
  }

  /**
   * Получить текущий уровень характеристики
   */
  private getCurrentStatLevel(user: User, stat: string): number {
    switch (stat) {
      case 'strength':
        return user.stats_strength;
      case 'agility':
        return user.stats_agility;
      case 'hp':
        return user.stats_hp;
      default:
        return 1;
    }
  }

  /**
   * Увеличить характеристику
   */
  private incrementStat(user: User, stat: string): void {
    switch (stat) {
      case 'strength':
        user.stats_strength += 1;
        break;
      case 'agility':
        user.stats_agility += 1;
        break;
      case 'hp':
        user.stats_hp += 10;
        user.current_hp += 10; // Также увеличиваем текущее HP
        break;
    }
  }

  /**
   * Получить название характеристики
   */
  private getStatName(stat: string): string {
    switch (stat) {
      case 'strength':
        return 'Сила';
      case 'agility':
        return 'Ловкость';
      case 'hp':
        return 'Здоровье';
      default:
        return stat;
    }
  }
}
