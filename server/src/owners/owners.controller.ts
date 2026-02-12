import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnerQueryDto } from './dto/owner-query.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PropertyManagerGuard } from '../auth/guards/property-manager.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owners')
export class OwnersController {
  constructor(private ownersService: OwnersService) {}

  @Post()
  @UseGuards(PropertyManagerGuard)
  @ApiOperation({ summary: 'Onboard a new owner (property manager only)' })
  create(@CurrentUser() user: User, @Body() dto: CreateOwnerDto) {
    return this.ownersService.create(user.id, user.role, dto);
  }

  @Get()
  @UseGuards(PropertyManagerGuard)
  @ApiOperation({ summary: 'List owners (property manager only)' })
  findAll(@CurrentUser() user: User, @Query() query: OwnerQueryDto) {
    const { page, limit, search } = query;
    return this.ownersService.findAll(user.id, user.role, { page, limit }, search);
  }

  @Get('me/managers')
  @ApiOperation({ summary: 'List managers for current owner' })
  getMyManagers(@CurrentUser() user: User) {
    return this.ownersService.getManagersForOwner(user.id, user.role);
  }

  @Get(':id')
  @UseGuards(PropertyManagerGuard)
  @ApiOperation({ summary: 'Get owner by id with properties (property manager only)' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ownersService.findById(user.id, user.role, id);
  }

  @Delete('managers/:managerId')
  @ApiOperation({ summary: 'Revoke manager entirely (owner only)' })
  revokeManager(@CurrentUser() user: User, @Param('managerId') managerId: string) {
    return this.ownersService.revokeManagerEntirely(managerId, user.id, user.role);
  }
}
