import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignManagerDto {
  @ApiProperty({ description: 'Manager user ID to assign' })
  @IsString()
  managerId: string;
}
