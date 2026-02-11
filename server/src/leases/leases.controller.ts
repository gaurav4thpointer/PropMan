import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';
import { LeaseQueryDto } from './dto/lease-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leases')
export class LeasesController {
  constructor(private leasesService: LeasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create lease (generates rent schedule)' })
  create(@CurrentUser() user: User, @Body() dto: CreateLeaseDto) {
    return this.leasesService.create(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leases' })
  findAll(@CurrentUser() user: User, @Query() query: LeaseQueryDto) {
    const { page, limit, ...filters } = query;
    return this.leasesService.findAll(user.id, user.role, { page, limit }, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lease with rent schedule' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.findOne(user.id, user.role, id);
  }

  @Get(':id/cascade-info')
  @ApiOperation({ summary: 'Get cascade info for lease' })
  getCascadeInfo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.getCascadeInfo(user.id, user.role, id);
  }

  @Patch(':id/terminate')
  @ApiOperation({ summary: 'Terminate lease early' })
  terminateEarly(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: TerminateLeaseDto) {
    return this.leasesService.terminateEarly(user.id, user.role, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive lease with cascade' })
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.archive(user.id, user.role, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived lease with cascade' })
  restore(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.restore(user.id, user.role, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lease (regenerates rent schedule)' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    return this.leasesService.update(user.id, user.role, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete lease' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.remove(user.id, user.role, id);
  }
}
