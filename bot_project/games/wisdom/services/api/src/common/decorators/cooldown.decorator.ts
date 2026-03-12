import { SetMetadata } from '@nestjs/common';
import { COOLDOWN_KEY, CooldownOptions } from '../guards/cooldown.guard';

/**
 * Декоратор для установки cooldown на действие
 * @param options - настройки cooldown
 * @example
 * @Cooldown({ key: 'hunt', ttl: 5 }) // 5 секунд между охотой
 */
export const Cooldown = (options: CooldownOptions) =>
  SetMetadata(COOLDOWN_KEY, options);
