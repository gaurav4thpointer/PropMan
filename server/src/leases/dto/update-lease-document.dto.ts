import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaseDocumentDto {
  @ApiPropertyOptional({ description: 'Display name for the document' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string | null;
}
