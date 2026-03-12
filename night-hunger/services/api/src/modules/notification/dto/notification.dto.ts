import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum NotificationType {
  PUSH = 'push',
  REMINDER = 'reminder',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.PUSH;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}

export class ScheduleReminderDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number; // Unix timestamp

  @IsString()
  @IsOptional()
  type?: string = 'hunt_reminder';
}

export class NotificationResponseDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  @IsOptional()
  jobId?: string;

  @IsString()
  message: string;
}

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  enablePush?: boolean = true;

  @IsBoolean()
  @IsOptional()
  enableReminders?: boolean = true;

  @IsString()
  @IsOptional()
  reminderTime?: string = '18:00'; // HH:MM format
}
