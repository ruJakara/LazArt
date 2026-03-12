import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { InventoryService, InventoryItem, UseItemResponse } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard';
import { UseItemDto, SellItemDto } from './dto/use-item.dto';

export interface SellItemResponse {
  success: boolean;
  itemId: string;
  soldQuantity: number;
  totalReceived: number;
  message: string;
}

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@Request() req): Promise<InventoryItem[]> {
    return this.inventoryService.getInventory(req.user.id);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  async useItem(@Request() req, @Body() dto: UseItemDto): Promise<UseItemResponse> {
    return this.inventoryService.useItem(req.user.id, dto);
  }

  @Post('sell')
  @HttpCode(HttpStatus.OK)
  async sellItem(
    @Request() req,
    @Body() dto: SellItemDto,
  ): Promise<SellItemResponse> {
    return this.inventoryService.sellItem(
      req.user.id,
      dto.itemId,
      dto.quantity || 1,
    );
  }
}
