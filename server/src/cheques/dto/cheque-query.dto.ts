import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ChequeStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ChequeQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ enum: ChequeStatus })
  @IsOptional()
  @IsEnum(ChequeStatus)
  status?: ChequeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
