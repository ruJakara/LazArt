import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async validateInitData(data: { initData: string }) {
    const isValid = this.validateTelegramInitData(
      data.initData,
      this.configService.get('TELEGRAM_BOT_TOKEN'),
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const params = new URLSearchParams(data.initData);
    const userStr = params.get('user');

    if (!userStr) {
      throw new UnauthorizedException('User data not found');
    }

    const telegramUser = JSON.parse(userStr);

    // Check if user exists, if not - create new user
    let user = await this.userService.findById(telegramUser.id);

    if (!user) {
      // Generate unique referral code
      const referralCode = await this.userService.generateReferralCode();

      // Create new user
      user = await this.userService.create({
        id: telegramUser.id,
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || 'ru',
        referral_code: referralCode,
        last_login: new Date(),
      });
    } else {
      // Update last login and user info
      await this.userService.update(user.id, {
        username: telegramUser.username || user.username,
        first_name: telegramUser.first_name || user.first_name,
        last_name: telegramUser.last_name || user.last_name,
        language_code: telegramUser.language_code || user.language_code,
        last_login: new Date(),
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user: payload,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserById(id: number) {
    return this.userService.findById(id);
  }

  private validateTelegramInitData(initData: string, botToken: string): boolean {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return computedHash === hash;
  }
}
