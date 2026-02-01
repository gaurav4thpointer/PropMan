import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Country, Currency, UnitStatus } from '@prisma/client';

export class CreateFirstUnitDto {
  @ApiProperty({ description: 'Unit number e.g. 101, A-2' })
  @IsString()
  unitNo: string;

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

export class CreatePropertyDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Optional first unit to create with the property' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateFirstUnitDto)
  firstUnit?: CreateFirstUnitDto;
}
