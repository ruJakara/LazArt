import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ShopService, ShopItem, BuyItemResponse } from './shop.service';
import { AuthGuard } from '../auth/auth.guard';
import { BuyItemDto } from './dto/buy-item.dto';

@Controller('shop')
@UseGuards(AuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  async getShopItems(
    @Request() req,
    @Query('type') shopType?: string,
  ): Promise<ShopItem[]> {
    return this.shopService.getShopItems(req.user.id, shopType);
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  async buyItem(
    @Request() req,
    @Body() dto: BuyItemDto,
  ): Promise<BuyItemResponse> {
    return this.shopService.buyItem(req.user.id, dto);
  }
}
