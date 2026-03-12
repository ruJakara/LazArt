import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    BullModule.registerQueue({
      name: 'reminder',
    }),
  ],
  providers: [
    NotificationService,
    {
      provide: 'BULL_NOTIFICATION_QUEUE',
      useFactory: () => BullModule.getQueue('notifications'),
    },
    {
      provide: 'BULL_REMINDER_QUEUE',
      useFactory: () => BullModule.getQueue('reminder'),
    },
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
