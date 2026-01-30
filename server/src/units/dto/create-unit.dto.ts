import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @ApiProperty({ description: 'Unit number e.g. 101, A-2' })
  @IsString()
  unitNo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ enum: UnitStatus, default: UnitStatus.VACANT })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
