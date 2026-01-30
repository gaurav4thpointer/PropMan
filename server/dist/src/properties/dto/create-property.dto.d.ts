import { Country, Currency } from '@prisma/client';
export declare class CreatePropertyDto {
    name: string;
    address?: string;
    country: Country;
    emirateOrState?: string;
    currency: Currency;
    notes?: string;
}
