import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Referral, User } from '../../database/entities';
import { ClaimBonusResponseDto, ReferralInfoDto } from './dto/referral.dto';

@Injectable()
export class ReferralService {
  private readonly REFERRAL_BONUS = 100;
  private readonly TELEGRAM_BOT_USERNAME =
    process.env.TELEGRAM_BOT_USERNAME || 'NightHungerBot';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    private readonly dataSource: DataSource,
  ) {}

  async getReferralCode(userId: string): Promise<ReferralInfoDto> {
    const normalizedUserId = String(userId);
    const user = await this.userRepository.findOne({
      where: { id: normalizedUserId },
      select: ['id', 'username', 'first_name', 'referral_code', 'referred_by'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let code = user.referral_code;
    if (!code) {
      code = await this.generateReferralCode(normalizedUserId);
    }

    const referredCount = await this.referralRepository.count({
      where: { referrer_id: normalizedUserId },
    });

    const pendingBonus = await this.referralRepository.count({
      where: {
        referrer_id: normalizedUserId,
        bonus_claimed: false,
      },
    });

    const totalBonusClaimed = await this.referralRepository.count({
      where: {
        referrer_id: normalizedUserId,
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

  async claimBonus(userId: string): Promise<ClaimBonusResponseDto> {
    const normalizedUserId = String(userId);
    const user = await this.userRepository.findOne({
      where: { id: normalizedUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pendingReferrals = await this.referralRepository.find({
      where: {
        referrer_id: normalizedUserId,
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const totalBonus = pendingReferrals.length * this.REFERRAL_BONUS;

      await queryRunner.manager.increment(
        User,
        { id: normalizedUserId },
        'blood_balance',
        totalBonus,
      );

      await queryRunner.manager.update(
        Referral,
        {
          referrer_id: normalizedUserId,
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
    const referrer = await this.userRepository.findOne({
      where: { referral_code: referralCode },
    });

    if (!referrer || referrer.id === newUser.id) {
      return;
    }

    const existingReferral = await this.referralRepository.findOne({
      where: {
        referrer_id: String(referrer.id),
        referred_id: String(newUser.id),
      },
    });

    if (existingReferral) {
      return;
    }

    const referral = this.referralRepository.create({
      referrer_id: String(referrer.id),
      referred_id: String(newUser.id),
      bonus_claimed: false,
    });

    await this.referralRepository.save(referral);

    newUser.referred_by = String(referrer.id);
    await this.userRepository.save(newUser);
  }

  private async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user?.referral_code) {
      return user.referral_code;
    }

    let code: string;
    let attempts = 0;

    do {
      const suffix = String(userId).slice(-6).padStart(6, '0');
      const random = Math.random().toString(36).substring(2, 4).toUpperCase();
      code = `REF${suffix}${random}`;

      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique referral code');
      }
    } while (await this.codeExists(code));

    await this.userRepository.update(
      { id: userId },
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
