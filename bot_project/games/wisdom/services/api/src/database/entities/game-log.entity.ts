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

@Entity('hunt_logs')
@Index(['user_id'])
@Index(['created_at'])
@Index(['success'])
export class GameLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'varchar', length: 50 })
  enemy_type: string;

  @Column({ type: 'int' })
  enemy_level: number;

  @Column({ type: 'varchar', length: 50 })
  action_taken: string; // 'attack', 'escape', 'feed'

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ type: 'int', default: 0 })
  xp_gained: number;

  @Column({ type: 'int', default: 0 })
  blood_gained: number;

  @Column({ type: 'int', default: 0 })
  hp_lost: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.game_logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
