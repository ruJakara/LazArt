import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export enum LeaderboardFilter {
  XP = 'xp',
  KILLS = 'kills',
  LEVEL = 'level',
}

export class GetLeaderboardDto {
  @IsNumber()
  @IsOptional()
  limit?: number = 50;

  @IsNumber()
  @IsOptional()
  offset?: number = 0;

  @IsEnum(LeaderboardFilter)
  @IsOptional()
  filter?: LeaderboardFilter = LeaderboardFilter.XP;
}

export class LeaderboardEntryDto {
  @IsNumber()
  rank: number;

  @IsNumber()
  userId: number;

  @IsString()
  username: string;

  @IsNumber()
  totalXp: number;

  @IsNumber()
  level: number;

  @IsNumber()
  totalKills: number;
}

export class PlayerPositionDto {
  @IsNumber()
  rank: number;

  @IsNumber()
  totalXp: number;

  @IsNumber()
  totalKills: number;

  @IsNumber()
  level: number;

  @IsNumber()
  percentile: number;
}
