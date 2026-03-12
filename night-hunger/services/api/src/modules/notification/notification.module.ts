import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Queue = require('bull');
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

const createQueue = (name: string, redisUrl: string): Queue.Queue =>
  new Queue(name, redisUrl);

@Module({
  providers: [
    NotificationService,
    {
      provide: 'BULL_NOTIFICATION_QUEUE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createQueue(
          'notifications',
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        ),
    },
    {
      provide: 'BULL_REMINDER_QUEUE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createQueue(
          'reminder',
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        ),
    },
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
