import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentDto {
    date: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    leaseId: string;
    tenantId: string;
    propertyId: string;
    unitId: string;
    chequeId?: string;
}
