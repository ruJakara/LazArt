import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('referrals')
@Index(['referrer_id'])
@Index(['referred_id'])
@Index(['bonus_claimed'])
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  referrer_id: number;

  @Column({ type: 'bigint' })
  referred_id: number;

  @Column({ type: 'boolean', default: false })
  bonus_claimed: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.referrals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referred_id' })
  referred: User;
}
