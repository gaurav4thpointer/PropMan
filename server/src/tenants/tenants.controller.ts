import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  create(@CurrentUser() user: User, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tenants' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.tenantsService.findAll(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.remove(user.id, id);
  }
}
