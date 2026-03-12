import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum PaymentCurrency {
  STARS = 'stars',
  BLOOD = 'blood',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentCurrency)
  @IsNotEmpty()
  currency: PaymentCurrency;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  itemId?: string;
}

export class PaymentResponseDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  invoiceUrl?: string;

  @IsNumber()
  @IsOptional()
  expiresAt?: number;
}

export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  id: string; // Telegram payment id

  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class PaymentHistoryDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  status: string;

  @IsString()
  createdAt: string;

  @IsString()
  @IsOptional()
  description?: string;
}
