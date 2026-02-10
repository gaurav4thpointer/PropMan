import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../admin/admin.service';

@ApiTags('config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
  constructor(private adminService: AdminService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get enabled countries/currencies for the current platform' })
  getCountries() {
    return this.adminService.getCountryConfig();
  }
}

