import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class TerminateLeaseDto {
  @ApiProperty({ example: '2026-06-15', description: 'Date the lease is terminated (must be between startDate and endDate)' })
  @IsDateString()
  terminationDate: string;
}
