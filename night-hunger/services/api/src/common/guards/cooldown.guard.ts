import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const COOLDOWN_KEY = 'cooldown';

export interface CooldownOptions {
  key: string;
  ttl: number; // в секундах
  message?: string;
}

@Injectable()
export class CooldownGuard implements CanActivate {
  private readonly cooldownCache = new Map<string, number>();

  constructor(private readonly reflector: Reflector) {}

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
    const now = Date.now();
    const expiresAt = this.cooldownCache.get(cooldownKey) || 0;
    const remainingMs = expiresAt - now;

    if (remainingMs > 0) {
      const remainingSec = Math.ceil(remainingMs / 1000);
      throw new ServiceUnavailableException(
        cooldown.message || `Слишком часто. Попробуйте через ${remainingSec} сек.`,
      );
    }

    this.cooldownCache.set(cooldownKey, now + cooldown.ttl * 1000);

    return true;
  }
}
