import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { HuntService } from './hunt.service';
import { CombatService } from './combat.service';
import { User } from '../database/entities/user.entity';
import { GameLog } from '../database/entities/game-log.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameLog]),
    UserModule,
  ],
  controllers: [GameController],
  providers: [GameService, HuntService, CombatService],
  exports: [GameService],
})
export class GameModule {}
