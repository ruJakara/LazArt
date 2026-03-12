import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum GameActionType {
  ATTACK = 'attack',
  ESCAPE = 'escape',
  FEED = 'feed',
}

export class GameActionDto {
  @IsEnum(GameActionType)
  @IsNotEmpty()
  action: GameActionType;

  @IsOptional()
  @IsNumber()
  enemyId?: number;
}

export class StartHuntResponseDto {
  enemy: {
    type: string;
    level: number;
    hp: number;
    maxHp: number;
    damage: number;
  };
  canEscape: boolean;
  canAttack: boolean;
}

export class GameActionResponseDto {
  success: boolean;
  xpGained: number;
  bloodGained: number;
  hpLost: number;
  playerHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  escaped: boolean;
  message: string;
}

export class GameStateResponseDto {
  user: {
    id: number;
    level: number;
    xp: number;
    bloodBalance: number;
    currentHp: number;
    maxHp: number;
  };
  currentHunt: {
    enemy: {
      type: string;
      level: number;
      hp: number;
      maxHp: number;
      damage: number;
    };
    userHp: number;
  } | null;
}
