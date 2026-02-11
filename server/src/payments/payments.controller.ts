import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchPaymentDto } from './dto/match-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  create(@CurrentUser() user: User, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  findAll(@CurrentUser() user: User, @Query() query: PaymentQueryDto) {
    const { page, limit, ...filters } = query;
    return this.paymentsService.findAll(user.id, user.role, { page, limit }, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment with schedule matches' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.paymentsService.findOne(user.id, user.role, id);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'Match payment to rent schedule entries' })
  matchToSchedule(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: MatchPaymentDto) {
    return this.paymentsService.matchToSchedule(user.id, user.role, id, dto.matches);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.paymentsService.remove(user.id, user.role, id);
  }
}
