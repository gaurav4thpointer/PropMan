import { RentFrequency } from '@prisma/client';
export declare class CreateLeaseDto {
    propertyId: string;
    unitId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    rentFrequency: RentFrequency;
    installmentAmount: number;
    dueDay: number;
    securityDeposit?: number;
    notes?: string;
}
