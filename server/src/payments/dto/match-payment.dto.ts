import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class MatchScheduleItemDto {
  @ApiProperty()
  @IsUUID()
  rentScheduleId: string;

  @ApiProperty({ description: 'Amount to apply to this schedule entry' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

export class MatchPaymentDto {
  @ApiProperty({ type: [MatchScheduleItemDto] })
  matches: MatchScheduleItemDto[];
}
