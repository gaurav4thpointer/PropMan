import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChequesService } from './cheques.service';
import { CreateChequeDto } from './dto/create-cheque.dto';
import { UpdateChequeDto } from './dto/update-cheque.dto';
import { ChequeStatusUpdateDto } from './dto/cheque-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ChequeStatus } from '@prisma/client';

@ApiTags('cheques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cheques')
export class ChequesController {
  constructor(private chequesService: ChequesService) {}

  @Post()
  @ApiOperation({ summary: 'Create cheque (PDC)' })
  create(@CurrentUser() user: User, @Body() dto: CreateChequeDto) {
    return this.chequesService.create(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cheques with filters' })
  findAll(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: ChequeStatus,
    @Query('search') search?: string,
  ) {
    return this.chequesService.findAll(user.id, user.role, pagination, { propertyId, tenantId, status, search });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Upcoming cheque dates (30/60/90 days)' })
  upcoming(
    @CurrentUser() user: User,
    @Query('days') days?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    const d = days === '60' ? 60 : days === '90' ? 90 : 30;
    return this.chequesService.upcoming(user.id, user.role, d as 30 | 60 | 90, propertyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cheque by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.chequesService.findOne(user.id, user.role, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cheque' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateChequeDto) {
    return this.chequesService.update(user.id, user.role, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update cheque status (validated transitions)' })
  updateStatus(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ChequeStatusUpdateDto) {
    return this.chequesService.updateStatus(user.id, user.role, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cheque' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.chequesService.remove(user.id, user.role, id);
  }
}
