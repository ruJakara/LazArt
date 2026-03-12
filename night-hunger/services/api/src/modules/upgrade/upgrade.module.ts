import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpgradeController } from './upgrade.controller';
import { UpgradeService } from './upgrade.service';
import { User } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UpgradeController],
  providers: [UpgradeService],
  exports: [UpgradeService],
})
export class UpgradeModule {}
