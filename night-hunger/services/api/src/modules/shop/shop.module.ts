import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Inventory, Item, Shop, User } from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, Item, User, Inventory]),
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
