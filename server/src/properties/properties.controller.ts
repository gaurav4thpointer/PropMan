import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
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
    return this.propertiesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List properties' })
  findAll(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('currency') currency?: string,
  ) {
    return this.propertiesService.findAll(user.id, pagination, { search, country, currency });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.remove(user.id, id);
  }
}
