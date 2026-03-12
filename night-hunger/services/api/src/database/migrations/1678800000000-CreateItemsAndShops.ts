import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateItemsAndShops1678800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Таблица items (справочник предметов)
    await queryRunner.createTable(
      new Table({
        name: 'items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            comment: "potion, skin, boost, material",
          },
          {
            name: 'rarity',
            type: 'varchar',
            length: '20',
            default: "'common'",
            comment: "common, rare, epic, legendary",
          },
          {
            name: 'effect_value',
            type: 'int',
            isNullable: true,
            comment: "Значение эффекта (HP restore, stat bonus, etc)",
          },
          {
            name: 'effect_duration',
            type: 'int',
            isNullable: true,
            comment: "Длительность эффекта в секундах (для boosts)",
          },
          {
            name: 'buy_price',
            type: 'int',
            default: '0',
            comment: "Цена покупки в крови",
          },
          {
            name: 'sell_price',
            type: 'int',
            default: '0',
            comment: "Цена продажи в крови",
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: "Иконка предмета (emoji или URL)",
          },
          {
            name: 'is_tradeable',
            type: 'boolean',
            default: 'true',
          },
          {
            name: 'is_usable',
            type: 'boolean',
            default: 'true',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Индекс на type для быстрой фильтрации
    await queryRunner.createIndex(
      'items',
      new TableIndex({
        name: 'idx_items_type',
        columnNames: ['type'],
      })
    );

    // Таблица shops (товары магазина)
    await queryRunner.createTable(
      new Table({
        name: 'shops',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'item_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'shop_type',
            type: 'varchar',
            length: '50',
            default: "'default'",
            comment: "default, premium, seasonal",
          },
          {
            name: 'price',
            type: 'int',
            comment: "Актуальная цена (может отличаться от items.buy_price)",
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'blood'",
            comment: "blood, stars, gold",
          },
          {
            name: 'stock',
            type: 'int',
            isNullable: true,
            comment: "Количество в наличии (null = безлимитно)",
          },
          {
            name: 'min_level',
            type: 'int',
            default: '1',
            comment: "Минимальный уровень для покупки",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: 'true',
          },
          {
            name: 'sort_order',
            type: 'int',
            default: '0',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Foreign key на items
    await queryRunner.createForeignKey(
      'shops',
      new TableForeignKey({
        name: 'fk_shops_item',
        columnNames: ['item_id'],
        referencedTableName: 'items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Индексы для shops
    await queryRunner.createIndex(
      'shops',
      new TableIndex({
        name: 'idx_shops_item_id',
        columnNames: ['item_id'],
      })
    );

    await queryRunner.createIndex(
      'shops',
      new TableIndex({
        name: 'idx_shops_shop_type',
        columnNames: ['shop_type'],
      })
    );

    await queryRunner.createIndex(
      'shops',
      new TableIndex({
        name: 'idx_shops_is_active',
        columnNames: ['is_active'],
      })
    );

    // Добавим колонку stat_points в users
    await queryRunner.addColumn(
      'users',
      new Table({
        name: 'stat_points',
        type: 'int',
        default: '0',
        comment: "Очки характеристик для распределения",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем foreign key
    const shopsTable = await queryRunner.getTable('shops');
    if (shopsTable) {
      const fk = shopsTable.foreignKeys.find((fk) => fk.name === 'fk_shops_item');
      if (fk) {
        await queryRunner.dropForeignKey('shops', fk);
      }
    }

    // Удаляем таблицы
    await queryRunner.dropTable('shops');
    await queryRunner.dropTable('items');

    // Удаляем колонку stat_points
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      const statPointsColumn = usersTable.columns.find((col) => col.name === 'stat_points');
      if (statPointsColumn) {
        await queryRunner.dropColumn('users', statPointsColumn);
      }
    }
  }
}
