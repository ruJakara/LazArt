import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('referral')
@UseGuards(AuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('code')
  async getReferralCode(@Request() req) {
    return this.referralService.getReferralCode(req.user.id);
  }

  @Post('bonus')
  async claimBonus(@Request() req) {
    return this.referralService.claimBonus(req.user.id);
  }
}
