import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { LevelService } from './level.service';

export interface AddXpResult {
  xpAdded: number;
  newTotalXp: number;
  levelsGained: number;
  newLevel: number;
  statPointsAwarded: number;
}

type UserId = string;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly levelService: LevelService,
  ) {}

  private normalizeId(id: string | number): UserId {
    return String(id);
  }

  async findById(id: string | number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: this.normalizeId(id) } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string | number, updates: Partial<User>): Promise<User> {
    const normalizedId = this.normalizeId(id);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }
    await this.userRepository.update({ id: normalizedId }, updates);
    return (await this.userRepository.findOne({ where: { id: normalizedId } })) as User;
  }

  async getProfile(userId: string | number) {
    const normalizedId = this.normalizeId(userId);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      level: user.level,
      bloodBalance: user.blood_balance,
      xp: user.xp,
      currentHp: user.current_hp,
      maxHp: user.stats_hp,
      skinId: user.skin_id,
      isPremium: user.is_premium,
      premiumExpiresAt: user.premium_expires_at,
      statPoints: user.stat_points,
    };
  }

  async getStats(userId: string | number) {
    const normalizedId = this.normalizeId(userId);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }

    return {
      strength: user.stats_strength,
      agility: user.stats_agility,
      hp: user.stats_hp,
      currentHp: user.current_hp,
      totalKills: 0, // TODO: Get from game logs
      totalXp: user.xp,
    };
  }

  async updateSkin(userId: string | number, skinId: string) {
    const normalizedId = this.normalizeId(userId);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }

    user.skin_id = skinId;
    await this.userRepository.save(user);

    return { success: true, skinId };
  }

  /**
   * Добавить XP и проверить повышение уровня
   */
  async addXp(userId: string | number, xpAmount: number): Promise<AddXpResult> {
    const normalizedId = this.normalizeId(userId);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }

    // Добавляем XP
    const newTotalXp = user.xp + xpAmount;
    
    // Проверяем повышение уровня
    const { newLevel, levelsGained } = this.levelService.checkLevelUp(
      user.level,
      newTotalXp,
    );

    // Начисляем stat points за уровни
    const statPointsAwarded = this.levelService.getStatPointsForLevels(levelsGained);
    
    if (levelsGained > 0) {
      user.level = newLevel;
      user.stat_points += statPointsAwarded;
      
      // Восстанавливаем HP при повышении уровня
      user.current_hp = user.stats_hp;
    }

    user.xp = newTotalXp;
    await this.userRepository.save(user);

    return {
      xpAdded: xpAmount,
      newTotalXp,
      levelsGained,
      newLevel,
      statPointsAwarded,
    };
  }

  /**
   * Получить информацию о прогрессе уровня
   */
  async getLevelProgress(userId: string | number) {
    const normalizedId = this.normalizeId(userId);
    const user = await this.findById(normalizedId);
    if (!user) {
      throw new NotFoundException(`User with ID ${normalizedId} not found`);
    }

    return this.levelService.getLevelInfo(user.xp, user.level);
  }

  async generateReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean;

    do {
      code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const existing = await this.userRepository.findOne({ where: { referral_code: code } });
      exists = !!existing;
    } while (exists);

    return code;
  }
}
