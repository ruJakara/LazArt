import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ValidateInitDataDto } from './dto/validate-init-data.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  async validateInitData(@Body() dto: ValidateInitDataDto) {
    return this.authService.validateInitData(dto);
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req) {
    return this.authService.getUserById(req.user.id);
  }
}
