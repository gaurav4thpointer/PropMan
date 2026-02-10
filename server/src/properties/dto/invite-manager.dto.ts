import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteManagerDto {
  @ApiProperty({ example: 'manager@example.com' })
  @IsEmail()
  email: string;
}
