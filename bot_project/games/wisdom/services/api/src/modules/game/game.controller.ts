import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from '../auth/auth.guard';
import { GameActionDto } from './dto/game-action.dto';
import {
  StartHuntResponseDto,
  GameActionResponseDto,
  GameStateResponseDto,
} from './dto/game-action.dto';
import { Cooldown } from '../../common/decorators/cooldown.decorator';
import { CooldownGuard } from '../../common/guards/cooldown.guard';

@Controller('game')
@UseGuards(AuthGuard, CooldownGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('hunt')
  @Cooldown({ key: 'hunt', ttl: 5, message: 'Подождите 5 секунд перед следующей охотой' })
  async startHunt(@Request() req): Promise<StartHuntResponseDto> {
    // Anti-cheat: проверка минимального времени между запросами
    return this.gameService.startHunt(req.user.id);
  }

  @Post('action')
  @HttpCode(HttpStatus.OK)
  @Cooldown({ key: 'game_action', ttl: 1, message: 'Слишком быстро! Подождите 1 секунду' })
  async performAction(
    @Request() req,
    @Body() dto: GameActionDto,
  ): Promise<GameActionResponseDto> {
    // Anti-cheat: валидация действия
    if (!dto.action || !['attack', 'escape', 'feed'].includes(dto.action)) {
      throw new BadRequestException('Недопустимое действие');
    }
    return this.gameService.performAction(req.user.id, dto);
  }

  @Get('state')
  async getGameState(@Request() req): Promise<GameStateResponseDto> {
    return this.gameService.getGameState(req.user.id);
  }

  @Post('respawn')
  @HttpCode(HttpStatus.OK)
  @Cooldown({ key: 'respawn', ttl: 10, message: 'Подождите 10 секунд перед следующим воскрешением' })
  async respawn(@Request() req): Promise<{ success: boolean; message: string }> {
    return this.gameService.respawn(req.user.id);
  }
}
