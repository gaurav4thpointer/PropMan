import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide stats (super admin only)' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent activity across platform (super admin only)' })
  getActivity(@Query('limit') limit?: string) {
    return this.adminService.getRecentActivity(limit ? parseInt(limit, 10) : 10);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (super admin only)' })
  getUsers(@Query() dto: PaginationDto, @Query('search') search?: string) {
    return this.adminService.getUsers(dto.page ?? 1, dto.limit ?? 20, search);
  }

  @Patch('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset a user password (super admin only)' })
  resetUserPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    return this.adminService.resetUserPassword(id, dto.newPassword);
  }

  @Post('users/:id/sample-data')
  @ApiOperation({ summary: 'Add random sample data for a user (super admin only)' })
  addSampleData(@Param('id') id: string) {
    return this.adminService.addSampleData(id);
  }
}
