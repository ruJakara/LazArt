import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePaymentDto, PaymentWebhookDto } from '../dto/create-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    // Принудительно устанавливаем userId из токена
    const paymentDto: CreatePaymentDto = {
      ...dto,
      userId: req.user.id,
    };
    return this.paymentService.createPayment(paymentDto);
  }

  @Post('webhook')
  async handleWebhook(@Body() data: PaymentWebhookDto) {
    return this.paymentService.handleWebhook(data);
  }

  @Get('status/:paymentId')
  @UseGuards(AuthGuard)
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    const payment = await this.paymentService.getPaymentStatus(paymentId);
    if (!payment) {
      return { error: 'Payment not found' };
    }
    return payment;
  }

  @Get('history')
  @UseGuards(AuthGuard)
  async getPaymentHistory(@Request() req) {
    const history = await this.paymentService.getUserPaymentHistory(req.user.id);
    return { history };
  }
}
