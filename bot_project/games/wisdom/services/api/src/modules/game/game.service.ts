import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GameLog } from '../../database/entities';
import { HuntService } from './hunt.service';
import { CombatService } from './combat.service';
import { GameActionDto } from './dto/game-action.dto';
import {
  StartHuntResponseDto,
  GameActionResponseDto,
  GameStateResponseDto,
} from './dto/game-action.dto';
import { GAME_CONFIG } from '@packages/shared/constants';
import { UserService } from '../user/user.service';

interface HuntSession {
  enemy: {
    type: string;
    level: number;
    hp: number;
    maxHp: number;
    damage: number;
  };
  userHp: number;
  startTime: number;
}

@Injectable()
export class GameService {
  // Временное хранилище сессий охоты (в production заменить на Redis)
  private huntSessions: Map<number, HuntSession> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameLog)
    private readonly gameLogRepository: Repository<GameLog>,
    private readonly huntService: HuntService,
    private readonly combatService: CombatService,
    private readonly userService: UserService,
  ) {}

  /**
   * Начало охоты
   */
  async startHunt(userId: number): Promise<StartHuntResponseDto> {
    // Проверка существующей охоты
    if (this.huntSessions.has(userId)) {
      throw new ConflictException('Охота уже активна');
    }

    // Проверка cooldown
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь ${userId} не найден`);
    }

    if (user.current_hp <= 0) {
      throw new BadRequestException('Нужно воскреснуть перед охотой');
    }

    // Генерация врага
    const enemy = this.huntService.findEnemy(user.level);

    // Создание сессии охоты
    this.huntSessions.set(userId, {
      enemy,
      userHp: user.current_hp,
      startTime: Date.now(),
    });

    return {
      enemy,
      canEscape: true,
      canAttack: true,
    };
  }

  /**
   * Выполнение действия в бою
   */
  async performAction(
    userId: number,
    dto: GameActionDto,
  ): Promise<GameActionResponseDto> {
    const session = this.huntSessions.get(userId);
    if (!session) {
      throw new BadRequestException('Охота не найдена. Начните охоту сначала');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь ${userId} не найден`);
    }

    // Проверка cooldown действия
    const timeSinceStart = Date.now() - session.startTime;
    if (timeSinceStart < GAME_CONFIG.ACTION_COOLDOWN) {
      throw new ConflictException(
        `Подождите ${GAME_CONFIG.ACTION_COOLDOWN / 1000}с между действиями`,
      );
    }

    let result: GameActionResponseDto;

    switch (dto.action) {
      case 'attack':
        result = await this.handleAttack(userId, user, session);
        break;
      case 'escape':
        result = await this.handleEscape(userId, user, session);
        break;
      case 'feed':
        result = await this.handleFeed(userId, user, session);
        break;
      default:
        throw new BadRequestException('Неизвестное действие');
    }

    // Обновление HP пользователя в сессии
    session.userHp = result.playerHp;

    // Если охота завершена, удаляем сессию
    if (result.success || result.escaped) {
      this.huntSessions.delete(userId);
    }

    return result;
  }

  /**
   * Обработка атаки
   */
  private async handleAttack(
    userId: number,
    user: User,
    session: HuntSession,
  ): Promise<GameActionResponseDto> {
    const { enemy } = session;

    // Расчет урона игрока
    const playerDamage = this.combatService.calcDamage(
      user.stats_strength,
      0,
    );
    enemy.hp = Math.max(0, enemy.hp - playerDamage);

    let message = `⚔️ Вы атаковали и нанесли ${playerDamage} урона`;

    // Если враг жив, он контратакует
    let hpLost = 0;
    if (enemy.hp > 0) {
      hpLost = enemy.damage;
      user.current_hp = Math.max(0, user.current_hp - hpLost);
      message += ` | Враг нанес ${hpLost} урона в ответ`;
    } else {
      // Победа
      const rewards = this.huntService.calculateRewards(enemy.level);
      
      // Используем новый метод addXp с проверкой уровня
      const xpResult = await this.userService.addXp(userId, rewards.xp);
      
      // Начисляем кровь
      user.blood_balance += rewards.blood;

      let levelUpMessage = '';
      if (xpResult.levelsGained > 0) {
        levelUpMessage = ` | 🎉 Уровень повышен! Теперь ${xpResult.newLevel} (+${xpResult.statPointsAwarded} очков характеристик)`;
      }

      message += ` | 🏆 Победа! +${rewards.xp} XP, +${rewards.blood} крови${levelUpMessage}`;

      // Логирование
      await this.logGameAction(userId, enemy, 'attack', true, rewards.xp, rewards.blood, hpLost);
    }

    await this.userRepository.save(user);

    return {
      success: enemy.hp <= 0,
      xpGained: enemy.hp <= 0 ? this.huntService.calculateRewards(enemy.level).xp : 0,
      bloodGained: enemy.hp <= 0 ? this.huntService.calculateRewards(enemy.level).blood : 0,
      hpLost,
      playerHp: user.current_hp,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      escaped: false,
      message,
    };
  }

  /**
   * Обработка побега
   */
  private async handleEscape(
    userId: number,
    user: User,
    session: HuntSession,
  ): Promise<GameActionResponseDto> {
    const { enemy } = session;

    const escapeSuccess = this.combatService.checkEscapeSuccess(
      user.stats_agility,
      enemy.level,
    );

    let hpLost = 0;
    let message = '';

    if (escapeSuccess) {
      message = '🏃 Вы успешно сбежали!';
      // Логирование
      await this.logGameAction(userId, enemy, 'escape', true, 0, 0, 0);
    } else {
      // Неудачный побег - враг атакует
      hpLost = enemy.damage;
      user.current_hp = Math.max(0, user.current_hp - hpLost);
      message = `❌ Побег не удался! Враг нанес ${hpLost} урона`;

      // Логирование
      await this.logGameAction(userId, enemy, 'escape', false, 0, 0, hpLost);
    }

    await this.userRepository.save(user);

    return {
      success: escapeSuccess,
      xpGained: 0,
      bloodGained: 0,
      hpLost,
      playerHp: user.current_hp,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      escaped: escapeSuccess,
      message,
    };
  }

  /**
   * Обработка поглощения
   */
  private async handleFeed(
    userId: number,
    user: User,
    session: HuntSession,
  ): Promise<GameActionResponseDto> {
    const { enemy } = session;

    // Поглощать можно только мертвого врага
    if (enemy.hp > 0) {
      throw new BadRequestException('Можно поглощать только мертвых врагов');
    }

    const healAmount = this.combatService.calcFeedAmount(enemy.level);
    const actualHeal = Math.min(healAmount, user.stats_hp - user.current_hp);
    user.current_hp += actualHeal;

    const xpGained = enemy.level * 10;
    user.xp += xpGained;

    const message = `🩸 Вы поглотили останки и восстановили ${actualHeal} HP, +${xpGained} XP`;

    // Логирование
    await this.logGameAction(userId, enemy, 'feed', true, xpGained, 0, 0);

    await this.userRepository.save(user);

    return {
      success: true,
      xpGained,
      bloodGained: 0,
      hpLost: -actualHeal, // Отрицательное значение = исцеление
      playerHp: user.current_hp,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      escaped: false,
      message,
    };
  }

  /**
   * Получение состояния игры
   */
  async getGameState(userId: number): Promise<GameStateResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь ${userId} не найден`);
    }

    const session = this.huntSessions.get(userId);

    return {
      user: {
        id: user.id,
        level: user.level,
        xp: user.xp,
        bloodBalance: user.blood_balance,
        currentHp: user.current_hp,
        maxHp: user.stats_hp,
      },
      currentHunt: session
        ? {
            enemy: { ...session.enemy },
            userHp: session.userHp,
          }
        : null,
    };
  }

  /**
   * Воскрешение
   */
  async respawn(userId: number): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь ${userId} не найден`);
    }

    if (user.current_hp > 0) {
      throw new BadRequestException('Вы уже живы');
    }

    // Воскрешение с 50% HP
    user.current_hp = Math.floor(user.stats_hp * 0.5);
    await this.userRepository.save(user);

    return {
      success: true,
      message: `Вы воскресли с ${user.current_hp} HP`,
    };
  }

  /**
   * Логирование игрового действия
   */
  private async logGameAction(
    userId: number,
    enemy: HuntSession['enemy'],
    action: string,
    success: boolean,
    xpGained: number,
    bloodGained: number,
    hpLost: number,
  ) {
    const log = this.gameLogRepository.create({
      user_id: userId,
      enemy_type: enemy.type,
      enemy_level: enemy.level,
      action_taken: action,
      success,
      xp_gained: xpGained,
      blood_gained: bloodGained,
      hp_lost: hpLost,
    });

    await this.gameLogRepository.save(log);
  }

  /**
   * Расчет XP для следующего уровня
   */
  private getXpForNextLevel(level: number): number {
    return Math.floor(GAME_CONFIG.BASE_XP * Math.pow(level, GAME_CONFIG.XP_MULTIPLIER));
  }
}
