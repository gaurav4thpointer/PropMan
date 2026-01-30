import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
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
    return this.leasesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leases' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.leasesService.findAll(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lease with rent schedule' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lease (regenerates rent schedule)' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    return this.leasesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lease' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leasesService.remove(user.id, id);
  }
}
