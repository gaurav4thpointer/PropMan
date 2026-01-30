import { ChequeStatus } from '@prisma/client';
export declare class UpdateChequeDto {
    status?: ChequeStatus;
    depositDate?: string;
    clearedOrBounceDate?: string;
    bounceReason?: string;
    notes?: string;
}
