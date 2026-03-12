import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Shop } from '../database/entities/shop.entity';
import { Item } from '../database/entities/item.entity';
import { User } from '../database/entities/user.entity';
import { Inventory } from '../database/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, Item, User, Inventory]),
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
