import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventory } from '../database/entities/inventory.entity';
import { User } from '../database/entities/user.entity';
import { Item } from '../database/entities/item.entity';
import { UseItemDto } from './dto/use-item.dto';

export interface InventoryItem {
  itemId: string;
  itemType: string;
  quantity: number;
  name?: string;
  icon?: string;
  effectValue?: number | null;
}

export interface UseItemResponse {
  success: boolean;
  itemId: string;
  message: string;
  effect?: {
    type: string;
    value: number;
  };
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить инвентарь игрока
   */
  async getInventory(userId: number): Promise<InventoryItem[]> {
    const inventory = await this.inventoryRepository.find({
      where: { user_id: userId },
      relations: ['user'],
    });

    // Получаем предметы из справочника
    const itemIds = inventory.map((inv) => inv.item_id);
    const items = await this.itemRepository.findByIds(itemIds);
    const itemMap = new Map(items.map((item) => [item.id, item]));

    return inventory.map((inv) => {
      const item = itemMap.get(inv.item_id);
      return {
        itemId: inv.item_id,
        itemType: inv.item_type,
        quantity: inv.quantity,
        name: item?.name,
        icon: item?.icon,
        effectValue: item?.effect_value,
      };
    });
  }

  /**
   * Использовать предмет
   */
  async useItem(userId: number, dto: UseItemDto): Promise<UseItemResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Находим предмет в инвентаре
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: { user_id: userId, item_id: dto.itemId },
      });

      if (!inventory || inventory.quantity <= 0) {
        throw new NotFoundException('Предмет не найден в инвентаре');
      }

      // Получаем информацию о предмете
      const item = await queryRunner.manager.findOne(Item, {
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException('Предмет не найден в базе');
      }

      if (!item.is_usable) {
        throw new BadRequestException('Этот предмет нельзя использовать');
      }

      let effect: { type: string; value: number } | undefined;
      let message = '';

      // Применяем эффект в зависимости от типа предмета
      switch (item.type) {
        case 'potion':
          effect = await this.applyPotion(queryRunner, userId, item);
          message = `Использовано: ${item.name}. Восстановлено ${effect.value} HP`;
          break;

        case 'boost':
          // TODO: Реализовать временные бусты
          effect = { type: 'boost', value: item.effect_value || 0 };
          message = `Буст активирован: ${item.name} (+${effect.value})`;
          break;

        case 'skin':
          await this.applySkin(queryRunner, userId, item);
          message = `Скин применён: ${item.name}`;
          break;

        default:
          throw new BadRequestException('Неизвестный тип предмета');
      }

      // Уменьшаем количество предмета
      inventory.quantity -= 1;
      if (inventory.quantity <= 0) {
        await queryRunner.manager.remove(inventory);
      } else {
        await queryRunner.manager.save(inventory);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        itemId: dto.itemId,
        message,
        effect,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Продать предмет
   */
  async sellItem(userId: number, itemId: string, quantity: number = 1): Promise<{
    success: boolean;
    itemId: string;
    soldQuantity: number;
    totalReceived: number;
    message: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Находим предмет в инвентаре
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: { user_id: userId, item_id: itemId },
      });

      if (!inventory || inventory.quantity <= 0) {
        throw new NotFoundException('Предмет не найден в инвентаре');
      }

      // Получаем информацию о предмете
      const item = await queryRunner.manager.findOne(Item, {
        where: { id: itemId },
      });

      if (!item) {
        throw new NotFoundException('Предмет не найден в базе');
      }

      if (!item.is_tradeable) {
        throw new BadRequestException('Этот предмет нельзя продать');
      }

      // Проверяем количество
      const sellQuantity = Math.min(quantity, inventory.quantity);

      // Начисляем кровь
      const totalReceived = item.sell_price * sellQuantity;
      await queryRunner.manager.increment(
        User,
        { id: userId },
        'blood_balance',
        totalReceived,
      );

      // Уменьшаем количество предмета
      inventory.quantity -= sellQuantity;
      if (inventory.quantity <= 0) {
        await queryRunner.manager.remove(inventory);
      } else {
        await queryRunner.manager.save(inventory);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        itemId,
        soldQuantity: sellQuantity,
        totalReceived,
        message: `Продано: ${sellQuantity} x ${item.name} за ${totalReceived} крови`,
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
  async addItem(
    userId: number,
    itemId: string,
    quantity: number = 1,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { user_id: userId, item_id: itemId },
    });

    if (inventory) {
      // Увеличиваем количество
      inventory.quantity += quantity;
      await this.inventoryRepository.save(inventory);
    } else {
      // Создаём новую запись
      const newInventory = this.inventoryRepository.create({
        user_id: userId,
        item_id,
        item_type: 'unknown', // Будет обновлено при получении из Item
        quantity,
      });
      await this.inventoryRepository.save(newInventory);
    }
  }

  /**
   * Применить зелье
   */
  private async applyPotion(
    queryRunner: any,
    userId: number,
    item: Item,
  ): Promise<{ type: string; value: number }> {
    const healAmount = item.effect_value || 0;
    
    // Получаем текущего пользователя
    const user = await queryRunner.manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Восстанавливаем HP (не больше максимума)
    const newHp = Math.min(user.current_hp + healAmount, user.stats_hp);
    const actualHeal = newHp - user.current_hp;

    await queryRunner.manager.update(
      User,
      { id: userId },
      { current_hp: newHp },
    );

    return { type: 'heal', value: actualHeal };
  }

  /**
   * Применить скин
   */
  private async applySkin(
    queryRunner: any,
    userId: number,
    item: Item,
  ): Promise<void> {
    await queryRunner.manager.update(
      User,
      { id: userId },
      { skin_id: item.id },
    );
  }
}
