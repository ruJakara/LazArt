import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { LeaderboardFilter } from './dto/leaderboard.dto';

@Controller('leaderboard')
@UseGuards(AuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('filter', new DefaultValuePipe(LeaderboardFilter.XP))
    filter: LeaderboardFilter,
  ) {
    const leaderboard = await this.leaderboardService.getLeaderboard(
      Math.min(limit, 100), // Максимум 100 записей
      offset,
      filter,
    );
    return { leaderboard, total: leaderboard.length };
  }

  @Get('me')
  async getMyPosition(@Request() req) {
    const position = await this.leaderboardService.getMyPosition(req.user.id);
    return position;
  }
}
