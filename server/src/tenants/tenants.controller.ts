import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
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
    return this.tenantsService.create(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tenants' })
  findAll(@CurrentUser() user: User, @Query() query: TenantQueryDto) {
    const { page, limit, search, includeArchived } = query;
    return this.tenantsService.findAll(user.id, user.role, { page, limit }, search, includeArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.findOne(user.id, user.role, id);
  }

  @Get(':id/cascade-info')
  @ApiOperation({ summary: 'Get cascade info for tenant' })
  getCascadeInfo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.getCascadeInfo(user.id, user.role, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.id, user.role, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive tenant with cascade' })
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.archive(user.id, user.role, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived tenant with cascade' })
  restore(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.restore(user.id, user.role, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete tenant' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tenantsService.remove(user.id, user.role, id);
  }
}
