import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentWebhookDto,
  PaymentCurrency,
  PaymentStatus,
} from '../dto/create-payment.dto';

export interface PaymentRecord {
  id: string;
  userId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class PaymentService {
  private readonly STAR_TO_BLOOD_RATE = 10; // 1 звезда = 10 крови
  private readonly payments: Map<string, PaymentRecord> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: String(dto.userId) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Создаём запись о платеже
    const payment: PaymentRecord = {
      id: paymentId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
      description: dto.description,
      createdAt: new Date(),
    };

    this.payments.set(paymentId, payment);

    // Для Telegram Stars создаём invoice
    if (dto.currency === PaymentCurrency.STARS) {
      const invoiceUrl = await this.createTelegramInvoice(dto.userId, dto.amount, paymentId);

      return {
        paymentId,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.PENDING,
        invoiceUrl,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 минут
      };
    }

    // Для других валют (например, внутренняя кровь)
    return {
      paymentId,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
    };
  }

  async handleWebhook(data: PaymentWebhookDto): Promise<{ success: boolean }> {
    const payment = this.payments.get(data.id);

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return { success: true }; // Уже обработан
    }

    // Обновляем статус платежа
    payment.status = data.status === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    payment.completedAt = new Date();
    this.payments.set(payment.id, payment);

    if (payment.status === PaymentStatus.COMPLETED) {
      // Начисляем бонусы пользователю
      await this.creditUser(payment);
    }

    return { success: true };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentRecord | null> {
    return this.payments.get(paymentId) || null;
  }

  async getUserPaymentHistory(userId: number): Promise<PaymentRecord[]> {
    return Array.from(this.payments.values()).filter((p) => p.userId === userId);
  }

  private async createTelegramInvoice(
    userId: number,
    amount: number,
    paymentId: string,
  ): Promise<string> {
    // В реальной реализации здесь будет вызов Telegram Bot API
    // Для sekarang возвращаем mock URL
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    const payload = Buffer.from(JSON.stringify({ userId, paymentId })).toString('base64');

    // Mock invoice URL для разработки
    return `https://t.me/${this.configService.get('TELEGRAM_BOT_USERNAME')}/invoice?payload=${payload}`;
  }

  private async creditUser(payment: PaymentRecord): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (payment.currency === PaymentCurrency.STARS) {
        // Конвертируем звёзды в кровь
        const bloodAmount = payment.amount * this.STAR_TO_BLOOD_RATE;

        await queryRunner.manager.increment(
          User,
          { id: String(payment.userId) },
          'blood_balance',
          bloodAmount,
        );
      } else if (payment.currency === PaymentCurrency.BLOOD) {
        // Прямое начисление крови
        await queryRunner.manager.increment(
          User,
          { id: String(payment.userId) },
          'blood_balance',
          payment.amount,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
