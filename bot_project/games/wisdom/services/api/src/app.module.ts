import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs/redis';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { GameModule } from './modules/game/game.module';
import { UserModule } from './modules/user/user.module';
import { UpgradeModule } from './modules/upgrade/upgrade.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ShopModule } from './modules/shop/shop.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReferralModule } from './modules/referral/referral.module';
import { NotificationModule } from './modules/notification/notification.module';
import { User, Inventory, GameLog, Referral, Item, Shop } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'night_hunger',
      entities: [User, Inventory, GameLog, Referral, Item, Shop],
      migrations: ['src/database/migrations/*.ts'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    }),
    RedisModule.forRoot({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    // Rate limiting: 100 запросов в минуту
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get('THROTTLE_TTL', 60000), // 1 миния
            limit: config.get('THROTTLE_LIMIT', 100), // 100 запросов
          },
        ],
        storage: {
          type: 'redis',
          storageOptions: {
            url: config.get('REDIS_URL', 'redis://localhost:6379'),
          },
        },
      }),
    }),
    AuthModule,
    GameModule,
    UserModule,
    UpgradeModule,
    InventoryModule,
    ShopModule,
    LeaderboardModule,
    PaymentModule,
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
