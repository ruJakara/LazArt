import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { User } from '../../database/entities/user.entity';
import { GameLog } from '../../database/entities/game-log.entity';
import { LeaderboardEntryDto, PlayerPositionDto, LeaderboardFilter } from '../dto/leaderboard.dto';

@Injectable()
export class LeaderboardService {
  private readonly LEADERBOARD_CACHE_KEY = 'leaderboard:global';
  private readonly CACHE_TTL = 300; // 5 минут

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameLog)
    private readonly gameLogRepository: Repository<GameLog>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async getLeaderboard(
    limit = 50,
    offset = 0,
    filter: LeaderboardFilter = LeaderboardFilter.XP,
  ): Promise<LeaderboardEntryDto[]> {
    // Пробуем получить из кэша
    const cached = await this.getFromCache(limit, offset, filter);
    if (cached) {
      return cached;
    }

    // Получаем из БД
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.level',
        'user.xp',
      ])
      .orderBy(this.getOrderByColumn(filter), 'DESC')
      .skip(offset)
      .take(limit);

    const users = await queryBuilder.getMany();

    // Получаем количество убийств для каждого игрока
    const userIds = users.map((u) => u.id);
    const killsStats = await this.getKillsStats(userIds);

    const result: LeaderboardEntryDto[] = users.map((user, index) => ({
      rank: offset + index + 1,
      userId: Number(user.id),
      username: this.formatUsername(user),
      totalXp: user.xp,
      level: user.level,
      totalKills: killsStats.get(Number(user.id))?.kills || 0,
    }));

    // Кэшируем результат
    await this.saveToCache(result, limit, offset, filter);

    return result;
  }

  async getMyPosition(userId: number): Promise<PlayerPositionDto> {
    const user = await this.userRepository.findOne({ where: { id: String(userId) } });

    if (!user) {
      return {
        rank: 0,
        totalXp: 0,
        totalKills: 0,
        level: 0,
        percentile: 0,
      };
    }

    // Считаем позицию игрока
    const playersAbove = await this.userRepository
      .createQueryBuilder('user')
      .where('user.xp > :xp', { xp: user.xp })
      .getCount();

    const totalPlayers = await this.userRepository.count();

    // Получаем количество убийств
    const kills = await this.gameLogRepository
      .createQueryBuilder('game_log')
      .select('COUNT(*)', 'count')
      .where('game_log.user_id = :userId', { userId: user.id })
      .andWhere('game_log.result->>\'result\' = :result', { result: 'win' })
      .getRawOne()
      .then((r) => parseInt(r.count, 10));

    const rank = playersAbove + 1;
    const percentile = totalPlayers > 0 ? ((totalPlayers - rank) / totalPlayers) * 100 : 0;

    return {
      rank,
      totalXp: user.xp,
      totalKills: kills,
      level: user.level,
      percentile: Math.round(percentile * 100) / 100,
    };
  }

  async invalidateCache(): Promise<void> {
    await this.redisClient.del(this.LEADERBOARD_CACHE_KEY);
  }

  private async getFromCache(
    limit: number,
    offset: number,
    filter: LeaderboardFilter,
  ): Promise<LeaderboardEntryDto[] | null> {
    const key = this.getCacheKey(limit, offset, filter);
    const data = await this.redisClient.get(key);

    if (data) {
      return JSON.parse(data) as LeaderboardEntryDto[];
    }

    return null;
  }

  private async saveToCache(
    data: LeaderboardEntryDto[],
    limit: number,
    offset: number,
    filter: LeaderboardFilter,
  ): Promise<void> {
    const key = this.getCacheKey(limit, offset, filter);
    await this.redisClient.setex(key, this.CACHE_TTL, JSON.stringify(data));
  }

  private getCacheKey(limit: number, offset: number, filter: LeaderboardFilter): string {
    return `${this.LEADERBOARD_CACHE_KEY}:${filter}:${limit}:${offset}`;
  }

  private getOrderByColumn(filter: LeaderboardFilter): string {
    switch (filter) {
      case LeaderboardFilter.KILLS:
        // Для сортировки по убийствам нужен JOIN с game_logs
        return 'user.xp'; // Fallback на XP
      case LeaderboardFilter.LEVEL:
        return 'user.level';
      case LeaderboardFilter.XP:
      default:
        return 'user.xp';
    }
  }

  private formatUsername(user: User): string {
    if (user.username) return user.username;
    if (user.first_name) return user.first_name;
    return `Player_${user.id.slice(-4)}`;
  }

  private async getKillsStats(
    userIds: number[],
  ): Promise<Map<number, { kills: number }>> {
    const stats = await this.gameLogRepository
      .createQueryBuilder('game_log')
      .select('game_log.user_id', 'user_id')
      .addSelect('COUNT(*)', 'kills')
      .where('game_log.user_id IN (:...userIds)', { userIds })
      .andWhere('game_log.result->>\'result\' = :result', { result: 'win' })
      .groupBy('game_log.user_id')
      .getRawMany();

    const map = new Map<number, { kills: number }>();
    for (const stat of stats) {
      map.set(parseInt(stat.user_id, 10), { kills: parseInt(stat.kills, 10) });
    }

    return map;
  }
}
