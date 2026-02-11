import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RentScheduleService } from './rent-schedule.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OverdueQueryDto } from './dto/rent-schedule-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('rent-schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rent-schedule')
export class RentScheduleController {
  constructor(private rentScheduleService: RentScheduleService) {}

  @Get('lease/:leaseId')
  @ApiOperation({ summary: 'List schedule by lease' })
  findByLease(
    @CurrentUser() user: User,
    @Param('leaseId') leaseId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.rentScheduleService.findByLease(user.id, user.role, leaseId, pagination);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'List overdue installments' })
  findOverdue(@CurrentUser() user: User, @Query() query: OverdueQueryDto) {
    const { page, limit, propertyId } = query;
    return this.rentScheduleService.findOverdue(user.id, user.role, propertyId, { page, limit });
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'List outstanding (due/overdue/partial)' })
  findOutstanding(
    @CurrentUser() user: User,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.rentScheduleService.findOutstanding(user.id, user.role, propertyId, from, to);
  }
}
