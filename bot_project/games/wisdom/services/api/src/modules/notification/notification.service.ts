import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import {
  SendNotificationDto,
  ScheduleReminderDto,
  NotificationType,
  NotificationPriority,
  NotificationResponseDto,
} from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  private notificationQueue: Queue;
  private reminderQueue: Queue;

  constructor(
    @Inject('BULL_NOTIFICATION_QUEUE')
    notificationQueue: Queue,
    @Inject('BULL_REMINDER_QUEUE')
    reminderQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.notificationQueue = notificationQueue;
    this.reminderQueue = reminderQueue;
  }

  async sendPush(
    userId: number,
    message: string,
    type: NotificationType = NotificationType.PUSH,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    data?: Record<string, any>,
  ): Promise<NotificationResponseDto> {
    try {
      const job = await this.notificationQueue.add(
        {
          userId,
          message,
          type,
          priority,
          data,
        },
        {
          priority: this.getJobPriority(priority),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      return {
        success: true,
        jobId: job.id?.toString(),
        message: 'Notification queued',
      };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        message: 'Failed to queue notification',
      };
    }
  }

  async scheduleReminder(
    userId: number,
    message: string,
    timestamp: number,
    type = 'hunt_reminder',
  ): Promise<NotificationResponseDto> {
    try {
      const delay = timestamp - Date.now();

      if (delay <= 0) {
        // Если время уже пришло, отправляем сразу
        return this.sendPush(userId, message, NotificationType.REMINDER);
      }

      const job = await this.reminderQueue.add(
        {
          userId,
          message,
          type,
        },
        {
          delay,
          attempts: 2,
        },
      );

      return {
        success: true,
        jobId: job.id?.toString(),
        message: 'Reminder scheduled',
      };
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return {
        success: false,
        message: 'Failed to schedule reminder',
      };
    }
  }

  async cancelReminder(jobId: string): Promise<boolean> {
    try {
      const job = await this.reminderQueue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
      return false;
    }
  }

  async sendDailyReminder(): Promise<void> {
    // Метод для отправки ежедневных напоминаний всем активным игрокам
    // Вызывается через cron job
    console.log('Sending daily reminders to active players...');
  }

  private getJobPriority(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.HIGH:
        return 10;
      case NotificationPriority.NORMAL:
        return 5;
      case NotificationPriority.LOW:
        return 1;
      default:
        return 5;
    }
  }
}
