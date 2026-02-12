import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 120 })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;
}
