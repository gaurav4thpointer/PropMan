import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard: expected vs received, overdue, upcoming cheques, bounced count' })
  dashboard(@CurrentUser() user: User, @Query('propertyId') propertyId?: string) {
    return this.reportsService.dashboard(user.id, propertyId);
  }

  @Get('export/cheques')
  @ApiOperation({ summary: 'Export cheques as CSV' })
  @Header('Content-Type', 'text/csv')
  async chequesCsv(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.reportsService.chequesCsv(user.id, propertyId, from, to);
    res.setHeader('Content-Disposition', 'attachment; filename=cheques.csv');
    res.send(csv);
  }

  @Get('export/rent-schedule')
  @ApiOperation({ summary: 'Export rent schedule as CSV' })
  @Header('Content-Type', 'text/csv')
  async rentScheduleCsv(
    @CurrentUser() user: User,
    @Res() res: Response,
    @Query('propertyId') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.reportsService.rentScheduleCsv(user.id, propertyId, from, to);
    res.setHeader('Content-Disposition', 'attachment; filename=rent-schedule.csv');
    res.send(csv);
  }
}
