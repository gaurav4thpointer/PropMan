import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

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
  @MinLength(1, { message: 'Cheque number is required' })
  chequeNumber: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Bank name is required' })
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
