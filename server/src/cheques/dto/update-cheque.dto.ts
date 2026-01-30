import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ChequeStatus } from '@prisma/client';

export class UpdateChequeDto {
  @ApiPropertyOptional({ enum: ChequeStatus })
  @IsOptional()
  @IsEnum(ChequeStatus)
  status?: ChequeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clearedOrBounceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bounceReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
