import { Country, Currency, UnitStatus } from '@prisma/client';
export declare class CreatePropertyDto {
    ownerId?: string;
    name: string;
    address?: string;
    country: Country;
    emirateOrState?: string;
    currency: Currency;
    unitNo?: string;
    bedrooms?: number;
    status?: UnitStatus;
    notes?: string;
}
