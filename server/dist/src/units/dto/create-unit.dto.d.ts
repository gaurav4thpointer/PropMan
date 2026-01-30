import { UnitStatus } from '@prisma/client';
export declare class CreateUnitDto {
    unitNo: string;
    bedrooms?: number;
    status?: UnitStatus;
    notes?: string;
}
