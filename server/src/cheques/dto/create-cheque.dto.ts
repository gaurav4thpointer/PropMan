import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateChequeDto {
  @ApiProperty()
  @IsUUID()
  leaseId: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty()
  @IsUUID()
  unitId: string;

  @ApiProperty()
  @IsString()
  chequeNumber: string;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty({ example: '2026-02-15' })
  @IsDateString()
  chequeDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Feb 2026 Rent' })
  @IsString()
  coversPeriod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
