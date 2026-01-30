import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, Max, IsDateString, IsNumber } from 'class-validator';
import { RentFrequency } from '@prisma/client';

export class CreateLeaseDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty()
  @IsUUID()
  unitId: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: RentFrequency })
  @IsEnum(RentFrequency)
  rentFrequency: RentFrequency;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  installmentAmount: number;

  @ApiProperty({ minimum: 1, maximum: 28, description: 'Day of month rent is due' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
