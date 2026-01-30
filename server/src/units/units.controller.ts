import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties/:propertyId/units')
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create unit in property' })
  create(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.create(user.id, propertyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List units in property' })
  findByProperty(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.unitsService.findByProperty(user.id, propertyId, pagination);
  }
}

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsByIdController {
  constructor(private unitsService: UnitsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.unitsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update unit' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete unit' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.unitsService.remove(user.id, id);
  }
}
