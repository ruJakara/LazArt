import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  SendNotificationDto,
  ScheduleReminderDto,
  NotificationType,
  NotificationPriority,
} from '../dto/notification.dto';

@Controller('notification')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendNotification(
    @Request() req,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notificationService.sendPush(
      req.user.id,
      dto.message,
      dto.type || NotificationType.PUSH,
      dto.priority || NotificationPriority.NORMAL,
      dto.data ? JSON.parse(dto.data) : undefined,
    );
  }

  @Post('reminder')
  async scheduleReminder(
    @Request() req,
    @Body() dto: ScheduleReminderDto,
  ) {
    return this.notificationService.scheduleReminder(
      req.user.id,
      dto.message,
      dto.timestamp,
      dto.type,
    );
  }

  @Delete('reminder/:jobId')
  async cancelReminder(@Param('jobId') jobId: string) {
    const result = await this.notificationService.cancelReminder(jobId);
    return { success: result };
  }
}
