import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Country, Currency, UnitStatus } from '@prisma/client';

export class CreatePropertyDto {
  @ApiPropertyOptional({ description: 'Required when creating as property manager (on behalf of owner)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: Country })
  @IsEnum(Country)
  country: Country;

  @ApiPropertyOptional({ description: 'Emirate (Dubai) or State (India)' })
  @IsOptional()
  @IsString()
  emirateOrState?: string;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional({ description: 'Unit number e.g. 101, A-2 (one property = one rentable unit)' })
  @IsOptional()
  @IsString()
  unitNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
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
