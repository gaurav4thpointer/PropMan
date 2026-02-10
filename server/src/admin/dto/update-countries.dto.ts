import { ApiProperty } from '@nestjs/swagger';
import { Country, Currency } from '@prisma/client';

export class UpdateCountriesDto {
  @ApiProperty({
    type: [String],
    description: 'Enabled country codes (subset of Country enum)',
    example: ['IN', 'AE', 'US'],
  })
  enabledCountries!: Country[];

  @ApiProperty({
    type: [String],
    description: 'Enabled currency codes (subset of Currency enum)',
    example: ['INR', 'AED', 'USD'],
  })
  enabledCurrencies!: Currency[];
}

