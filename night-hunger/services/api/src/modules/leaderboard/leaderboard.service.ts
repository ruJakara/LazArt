import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameLog, User } from '../../database/entities';
import {
  LeaderboardEntryDto,
  LeaderboardFilter,
  PlayerPositionDto,
} from './dto/leaderboard.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameLog)
    private readonly gameLogRepository: Repository<GameLog>,
  ) {}

  async getLeaderboard(
    limit = 50,
    offset = 0,
    filter: LeaderboardFilter = LeaderboardFilter.XP,
  ): Promise<LeaderboardEntryDto[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeOffset = Math.max(0, offset);

    if (filter === LeaderboardFilter.KILLS) {
      return this.getKillsLeaderboard(safeLimit, safeOffset);
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.level',
        'user.xp',
      ])
      .orderBy(this.getOrderByColumn(filter), 'DESC')
      .addOrderBy('user.id', 'ASC')
      .skip(safeOffset)
      .take(safeLimit)
      .getMany();

    const userIds = users.map((u) => u.id);
    const killsStats = await this.getKillsStats(userIds);

    return users.map((user, index) => ({
      rank: safeOffset + index + 1,
      userId: Number(user.id),
      username: this.formatUsername(user),
      totalXp: user.xp,
      level: user.level,
      totalKills: killsStats.get(Number(user.id))?.kills || 0,
    }));
  }

  async getMyPosition(userId: string): Promise<PlayerPositionDto> {
    const normalizedUserId = String(userId);
    const user = await this.userRepository.findOne({ where: { id: normalizedUserId } });

    if (!user) {
      return {
        rank: 0,
        totalXp: 0,
        totalKills: 0,
        level: 0,
        percentile: 0,
      };
    }

    const playersAbove = await this.userRepository
      .createQueryBuilder('user')
      .where('user.xp > :xp', { xp: user.xp })
      .getCount();

    const totalPlayers = await this.userRepository.count();

    const kills = await this.gameLogRepository.count({
      where: {
        user_id: user.id,
        success: true,
      },
    });

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

  private async getKillsLeaderboard(
    limit: number,
    offset: number,
  ): Promise<LeaderboardEntryDto[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.first_name',
        'user.level',
        'user.xp',
      ])
      .orderBy('user.id', 'ASC')
      .getMany();

    const killsStats = await this.getKillsStats(users.map((u) => u.id));

    const sortedEntries = users
      .map((user) => ({
        user,
        kills: killsStats.get(Number(user.id))?.kills || 0,
      }))
      .sort((left, right) => {
        if (right.kills !== left.kills) {
          return right.kills - left.kills;
        }

        if (right.user.xp !== left.user.xp) {
          return right.user.xp - left.user.xp;
        }

        if (right.user.level !== left.user.level) {
          return right.user.level - left.user.level;
        }

        return left.user.id.localeCompare(right.user.id);
      });

    return sortedEntries.slice(offset, offset + limit).map((entry, index) => ({
      rank: offset + index + 1,
      userId: Number(entry.user.id),
      username: this.formatUsername(entry.user),
      totalXp: entry.user.xp,
      level: entry.user.level,
      totalKills: entry.kills,
    }));
  }

  private getOrderByColumn(filter: LeaderboardFilter): string {
    switch (filter) {
      case LeaderboardFilter.KILLS:
        return 'user.xp';
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
    userIds: string[],
  ): Promise<Map<number, { kills: number }>> {
    if (userIds.length === 0) {
      return new Map<number, { kills: number }>();
    }

    const stats = await this.gameLogRepository
      .createQueryBuilder('game_log')
      .select('game_log.user_id', 'user_id')
      .addSelect('COUNT(*)', 'kills')
      .where('game_log.user_id IN (:...userIds)', { userIds })
      .andWhere('game_log.success = :success', { success: true })
      .groupBy('game_log.user_id')
      .getRawMany();

    const map = new Map<number, { kills: number }>();
    for (const stat of stats) {
      map.set(parseInt(stat.user_id, 10), { kills: parseInt(stat.kills, 10) });
    }

    return map;
  }
}
