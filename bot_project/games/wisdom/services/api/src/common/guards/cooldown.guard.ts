import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '@nestjs/redis';
import { Redis } from 'ioredis';

export const COOLDOWN_KEY = 'cooldown';

export interface CooldownOptions {
  key: string;
  ttl: number; // в секундах
  message?: string;
}

@Injectable()
export class CooldownGuard implements CanActivate {
  private redis: Redis;

  constructor(private reflector: Reflector, private redisService: RedisService) {
    this.redis = this.redisService.client();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const cooldown = this.reflector.get<CooldownOptions>(
      COOLDOWN_KEY,
      context.getHandler(),
    );

    if (!cooldown) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.body?.userId || request.query?.userId;

    if (!userId) {
      return true; // Пропускаем, если нет userId
    }

    const cooldownKey = `cooldown:${userId}:${cooldown.key}`;
    const cooldownActive = await this.redis.get(cooldownKey);

    if (cooldownActive) {
      const remaining = await this.redis.ttl(cooldownKey);
      throw new ServiceUnavailableException(
        cooldown.message || `Слишком часто. Попробуйте через ${remaining} сек.`,
      );
    }

    // Устанавливаем cooldown
    await this.redis.setex(cooldownKey, cooldown.ttl, '1');

    return true;
  }
}
