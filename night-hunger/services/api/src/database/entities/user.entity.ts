import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { GameLog } from './game-log.entity';
import { Referral } from './referral.entity';

@Entity('users')
@Index(['level'])
@Index(['xp'])
@Index(['blood_balance'])
@Index(['referral_code'])
export class User {
  @PrimaryColumn('bigint')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name: string | null;

  @Column({ type: 'varchar', length: 10, default: 'ru' })
  language_code: string;

  @Column({ type: 'int', default: 0 })
  blood_balance: number;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 1 })
  stats_strength: number;

  @Column({ type: 'int', default: 1 })
  stats_agility: number;

  @Column({ type: 'int', default: 100 })
  stats_hp: number;

  @Column({ type: 'int', default: 100 })
  current_hp: number;

  @Column({ type: 'int', default: 0 })
  stat_points: number;

  @Column({ type: 'varchar', length: 50, default: 'default' })
  skin_id: string;

  @Column({ type: 'boolean', default: false })
  is_premium: boolean;

  @Column({ type: 'timestamp', nullable: true })
  premium_expires_at: Date | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  referral_code: string | null;

  @Column({ type: 'bigint', nullable: true })
  referred_by: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_login: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Inventory, (inventory) => inventory.user)
  inventory: Inventory[];

  @OneToMany(() => GameLog, (gameLog) => gameLog.user)
  game_logs: GameLog[];

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'referred_by' })
  referrer: User | null;

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referrals: Referral[];
}
