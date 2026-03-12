import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Inventory, Item, Shop, User } from '../../database/entities';
import { BuyItemDto } from './dto/buy-item.dto';

export interface ShopItem {
  id: number;
  itemId: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  rarity: string;
  price: number;
  currency: string;
  stock: number | null;
  minLevel: number;
  canAfford: boolean;
  meetsLevelRequirement: boolean;
}

export interface BuyItemResponse {
  success: boolean;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPaid: number;
  message: string;
}

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить товары магазина
   */
  async getShopItems(
    userId: string,
    shopType: string = 'default',
  ): Promise<ShopItem[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Получаем товары из магазина
    const shops = await this.shopRepository.find({
      where: {
        shop_type: shopType,
        is_active: true,
      },
      relations: ['item'],
      order: {
        sort_order: 'ASC',
      },
    });

    return shops
      .filter((shop) => shop.item !== null)
      .map((shop) => {
        const item = shop.item!;
        return {
          id: shop.id,
          itemId: item.id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          type: item.type,
          rarity: item.rarity,
          price: shop.price,
          currency: shop.currency,
          stock: shop.stock,
          minLevel: shop.min_level,
          canAfford: user.blood_balance >= shop.price,
          meetsLevelRequirement: user.level >= shop.min_level,
        };
      });
  }

  /**
   * Купить предмет
   */
  async buyItem(
    userId: string,
    dto: BuyItemDto,
  ): Promise<BuyItemResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const shopType = dto.shopType || 'default';

      // Находим товар в магазине
      const shop = await queryRunner.manager.findOne(Shop, {
        where: {
          item_id: dto.itemId,
          shop_type: shopType,
          is_active: true,
        },
        relations: ['item'],
      });

      if (!shop || !shop.item) {
        throw new NotFoundException('Товар не найден в магазине');
      }

      const item = shop.item;

      // Получаем пользователя
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Проверка уровня
      if (user.level < shop.min_level) {
        throw new BadRequestException(
          `Требуется уровень ${shop.min_level}`,
        );
      }

      // Проверка баланса
      if (user.blood_balance < shop.price) {
        throw new BadRequestException(
          `Недостаточно крови. Нужно: ${shop.price}, есть: ${user.blood_balance}`,
        );
      }

      // Проверка наличия (если ограничено)
      if (shop.stock !== null && shop.stock <= 0) {
        throw new BadRequestException('Товар закончился');
      }

      // Списываем кровь
      user.blood_balance -= shop.price;
      await queryRunner.manager.save(user);

      // Добавляем предмет в инвентарь
      await this.addToInventory(
        queryRunner,
        userId,
        item.id,
        item.type,
        1,
      );

      // Уменьшаем stock (если ограничено)
      if (shop.stock !== null) {
        shop.stock -= 1;
        await queryRunner.manager.save(shop);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        totalPaid: shop.price,
        message: `Куплено: ${item.name} за ${shop.price} крови`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Добавить предмет в инвентарь
   */
  private async addToInventory(
    queryRunner: QueryRunner,
    userId: string,
    itemId: string,
    itemType: string,
    quantity: number,
  ): Promise<void> {
    const inventory = await queryRunner.manager.findOne(Inventory, {
      where: { user_id: userId, item_id: itemId },
    });

    if (inventory) {
      inventory.quantity += quantity;
      await queryRunner.manager.save(inventory);
    } else {
      const newInventory = queryRunner.manager.create(Inventory, {
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        quantity,
      });
      await queryRunner.manager.save(newInventory);
    }
  }
}
