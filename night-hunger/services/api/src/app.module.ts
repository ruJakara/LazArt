import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { GameModule } from './modules/game/game.module';
import { UserModule } from './modules/user/user.module';
import { UpgradeModule } from './modules/upgrade/upgrade.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ShopModule } from './modules/shop/shop.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { ReferralModule } from './modules/referral/referral.module';
import { NotificationModule } from './modules/notification/notification.module';
import { User, Inventory, GameLog, Referral, Item, Shop } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: Number.parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'night_hunger',
          }),
      entities: [User, Inventory, GameLog, Referral, Item, Shop],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    // Stage 2 MVP: in-memory throttling for core modules only.
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: Number.parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: Number.parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    AuthModule,
    GameModule,
    UserModule,
    UpgradeModule,
    InventoryModule,
    ShopModule,
    LeaderboardModule,
    ReferralModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
