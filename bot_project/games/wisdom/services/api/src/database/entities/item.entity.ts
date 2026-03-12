import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Shop } from './shop.entity';

@Entity('items')
export class Item {
  @PrimaryColumn('varchar', { length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'potion', 'skin', 'boost', 'material'

  @Column({ type: 'varchar', length: 20, default: 'common' })
  rarity: string; // 'common', 'rare', 'epic', 'legendary'

  @Column({ type: 'int', nullable: true })
  effect_value: number | null;

  @Column({ type: 'int', nullable: true })
  effect_duration: number | null; // в секундах

  @Column({ type: 'int', default: 0 })
  buy_price: number;

  @Column({ type: 'int', default: 0 })
  sell_price: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'boolean', default: true })
  is_tradeable: boolean;

  @Column({ type: 'boolean', default: true })
  is_usable: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Shop, (shop) => shop.item)
  shops: Shop[];
}
