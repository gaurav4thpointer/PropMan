import { ChequeStatus } from '@prisma/client';
export declare class ChequeStatusUpdateDto {
    status: ChequeStatus;
    depositDate?: string;
    clearedOrBounceDate?: string;
    bounceReason?: string;
    replacedByChequeId?: string;
}
