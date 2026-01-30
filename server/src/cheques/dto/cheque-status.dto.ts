import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChequeStatus } from '@prisma/client';

export class ChequeStatusUpdateDto {
  @ApiProperty({ enum: ChequeStatus })
  @IsEnum(ChequeStatus)
  status: ChequeStatus;

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

  @ApiPropertyOptional({ description: 'Required when status = REPLACED' })
  @IsOptional()
  @IsUUID()
  replacedByChequeId?: string;
}
