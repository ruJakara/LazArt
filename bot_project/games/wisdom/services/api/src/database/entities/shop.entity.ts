import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from './item.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  item_id: string;

  @Column({ type: 'varchar', length: 50, default: 'default' })
  @Index()
  shop_type: string; // 'default', 'premium', 'seasonal'

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'blood' })
  currency: string; // 'blood', 'stars', 'gold'

  @Column({ type: 'int', nullable: true })
  stock: number | null; // null = безлимитно

  @Column({ type: 'int', default: 1 })
  min_level: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Item, (item) => item.shops, { eager: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
