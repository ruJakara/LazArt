import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Referral } from '../../database/entities/referral.entity';
import { ReferralInfoDto, ClaimBonusResponseDto } from '../dto/referral.dto';

@Injectable()
export class ReferralService {
  private readonly REFERRAL_BONUS = 100; // Бонус за реферала в крови
  private readonly TELEGRAM_BOT_USERNAME = 'NightHungerBot'; // Заменить на актуальный

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    private readonly dataSource: DataSource,
  ) {}

  async getReferralCode(userId: number): Promise<ReferralInfoDto> {
    const user = await this.userRepository.findOne({
      where: { id: String(userId) },
      select: ['id', 'username', 'first_name', 'referral_code', 'referred_by'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Генерируем код если нет
    let code = user.referral_code;
    if (!code) {
      code = await this.generateReferralCode(userId);
    }

    // Считаем статистику
    const referredCount = await this.referralRepository.count({
      where: { referrer_id: String(userId) },
    });

    const pendingBonus = await this.referralRepository.count({
      where: {
        referrer_id: String(userId),
        bonus_claimed: false,
      },
    });

    const totalBonusClaimed = await this.referralRepository.count({
      where: {
        referrer_id: String(userId),
        bonus_claimed: true,
      },
    });

    return {
      code,
      referredCount,
      totalBonusClaimed: totalBonusClaimed * this.REFERRAL_BONUS,
      pendingBonus: pendingBonus * this.REFERRAL_BONUS,
      referralLink: `https://t.me/${this.TELEGRAM_BOT_USERNAME}?start=${code}`,
    };
  }

  async claimBonus(userId: number): Promise<ClaimBonusResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: String(userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Находим все неотмеченные рефералы
    const pendingReferrals = await this.referralRepository.find({
      where: {
        referrer_id: String(userId),
        bonus_claimed: false,
      },
    });

    if (pendingReferrals.length === 0) {
      return {
        success: false,
        bonus: 0,
        message: 'Нет доступных бонусов',
      };
    }

    // Начисляем бонусы в транзакции
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const totalBonus = pendingReferrals.length * this.REFERRAL_BONUS;

      // Обновляем баланс пользователя
      await queryRunner.manager.increment(
        User,
        { id: String(userId) },
        'blood_balance',
        totalBonus,
      );

      // Отмечаем бонусы как полученные
      await queryRunner.manager.update(
        Referral,
        {
          referrer_id: String(userId),
          bonus_claimed: false,
        },
        { bonus_claimed: true },
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        bonus: totalBonus,
        message: `Получено ${totalBonus} крови за ${pendingReferrals.length} реферал(ов)`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processReferral(newUser: User, referralCode: string): Promise<void> {
    // Проверяем реферальный код
    const referrer = await this.userRepository.findOne({
      where: { referral_code: referralCode },
    });

    if (!referrer || referrer.id === newUser.id) {
      return; // Неверный код или сам на себя
    }

    // Проверяем, не был ли уже реферал
    const existingReferral = await this.referralRepository.findOne({
      where: {
        referrer_id: String(referrer.id),
        referred_id: String(newUser.id),
      },
    });

    if (existingReferral) {
      return;
    }

    // Создаём запись о реферале
    const referral = this.referralRepository.create({
      referrer_id: String(referrer.id),
      referred_id: String(newUser.id),
      bonus_claimed: false,
    });

    await this.referralRepository.save(referral);

    // Обновляем referred_by у нового пользователя
    newUser.referred_by = BigInt(referrer.id);
    await this.userRepository.save(newUser);
  }

  private async generateReferralCode(userId: number): Promise<string> {
    // Проверяем существующий код
    const user = await this.userRepository.findOne({
      where: { id: String(userId) },
    });

    if (user?.referral_code) {
      return user.referral_code;
    }

    // Генерируем уникальный код
    let code: string;
    let attempts = 0;

    do {
      // Формат: REF + последние 6 символов ID + случайные 2 символа
      const suffix = String(userId).slice(-6).padStart(6, '0');
      const random = Math.random().toString(36).substring(2, 4).toUpperCase();
      code = `REF${suffix}${random}`;

      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique referral code');
      }
    } while (await this.codeExists(code));

    // Сохраняем код
    await this.userRepository.update(
      { id: String(userId) },
      { referral_code: code },
    );

    return code;
  }

  private async codeExists(code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { referral_code: code },
    });
    return !!user;
  }
}
