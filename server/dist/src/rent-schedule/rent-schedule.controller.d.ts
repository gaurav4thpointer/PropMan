import { RentScheduleService } from './rent-schedule.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OverdueQueryDto } from './dto/rent-schedule-query.dto';
import { User } from '@prisma/client';
export declare class RentScheduleController {
    private rentScheduleService;
    constructor(rentScheduleService: RentScheduleService);
    findByLease(user: User, leaseId: string, pagination: PaginationDto): Promise<{
        data: ({
            lease: {
                id: string;
                property: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import(".prisma/client").$Enums.UnitStatus | null;
                    notes: string | null;
                    ownerId: string;
                    address: string | null;
                    country: import(".prisma/client").$Enums.Country;
                    emirateOrState: string | null;
                    currency: import(".prisma/client").$Enums.Currency;
                    unitNo: string | null;
                    bedrooms: number | null;
                };
                tenant: {
                    name: string;
                    id: string;
                    email: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    notes: string | null;
                    ownerId: string;
                    phone: string | null;
                    idNumber: string | null;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            leaseId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOverdue(user: User, query: OverdueQueryDto): Promise<{
        data: ({
            lease: {
                property: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import(".prisma/client").$Enums.UnitStatus | null;
                    notes: string | null;
                    ownerId: string;
                    address: string | null;
                    country: import(".prisma/client").$Enums.Country;
                    emirateOrState: string | null;
                    currency: import(".prisma/client").$Enums.Currency;
                    unitNo: string | null;
                    bedrooms: number | null;
                };
                tenant: {
                    name: string;
                    id: string;
                    email: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    notes: string | null;
                    ownerId: string;
                    phone: string | null;
                    idNumber: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                startDate: Date;
                endDate: Date;
                terminationDate: Date | null;
                rentFrequency: import(".prisma/client").$Enums.RentFrequency;
                installmentAmount: import("@prisma/client/runtime/library").Decimal;
                dueDay: number;
                securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
                notes: string | null;
                propertyId: string;
                tenantId: string;
                ownerId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            leaseId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOutstanding(user: User, propertyId?: string, from?: string, to?: string): Promise<({
        lease: {
            property: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.UnitStatus | null;
                notes: string | null;
                ownerId: string;
                address: string | null;
                country: import(".prisma/client").$Enums.Country;
                emirateOrState: string | null;
                currency: import(".prisma/client").$Enums.Currency;
                unitNo: string | null;
                bedrooms: number | null;
            };
            tenant: {
                name: string;
                id: string;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                ownerId: string;
                phone: string | null;
                idNumber: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            startDate: Date;
            endDate: Date;
            terminationDate: Date | null;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            propertyId: string;
            tenantId: string;
            ownerId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        dueDate: Date;
        expectedAmount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal | null;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        leaseId: string;
    })[]>;
}
