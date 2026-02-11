import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a property' })
  create(@CurrentUser() user: User, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.id, user.role, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List properties' })
  findAll(@CurrentUser() user: User, @Query() query: PropertyQueryDto) {
    const { page, limit, ...filters } = query;
    return this.propertiesService.findAll(user.id, user.role, { page, limit }, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.findOne(user.id, user.role, id);
  }

  @Get(':id/cascade-info')
  @ApiOperation({ summary: 'Get cascade info for property (counts of related records)' })
  getCascadeInfo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.getCascadeInfo(user.id, user.role, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(user.id, user.role, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive property with cascade' })
  archive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.archive(user.id, user.role, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived property with cascade' })
  restore(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.restore(user.id, user.role, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete property' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.remove(user.id, user.role, id);
  }
}
