import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { UpgradeService, UpgradeOption } from './upgrade.service';
import { AuthGuard } from '../auth/auth.guard';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';

export interface BuyUpgradeResponse {
  success: boolean;
  stat: string;
  newLevel: number;
  cost: number;
  message: string;
}

@Controller('upgrade')
@UseGuards(AuthGuard)
export class UpgradeController {
  constructor(private readonly upgradeService: UpgradeService) {}

  @Get('options')
  async getUpgradeOptions(@Request() req): Promise<UpgradeOption[]> {
    return this.upgradeService.getUpgradeOptions(String(req.user.id));
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  async buyUpgrade(@Request() req, @Body() dto: BuyUpgradeDto): Promise<BuyUpgradeResponse> {
    return this.upgradeService.buyUpgrade(String(req.user.id), dto);
  }
}
