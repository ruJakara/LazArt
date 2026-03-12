import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateSkinDto } from './dto/update-skin.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getProfile(String(req.user.id));
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.userService.getStats(String(req.user.id));
  }

  @Put('skin')
  async updateSkin(@Request() req, @Body() dto: UpdateSkinDto) {
    return this.userService.updateSkin(String(req.user.id), dto.skinId);
  }
}
