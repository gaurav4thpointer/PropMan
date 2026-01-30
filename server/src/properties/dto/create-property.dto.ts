import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Country, Currency } from '@prisma/client';

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
}
