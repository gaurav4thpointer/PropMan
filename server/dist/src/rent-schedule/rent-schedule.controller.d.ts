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
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    address: string | null;
                    country: import(".prisma/client").$Enums.Country;
                    emirateOrState: string | null;
                    currency: import(".prisma/client").$Enums.Currency;
                    unitNo: string | null;
                    bedrooms: number | null;
                    status: import(".prisma/client").$Enums.UnitStatus | null;
                    notes: string | null;
                    archivedAt: Date | null;
                    ownerId: string;
                };
                tenant: {
                    id: string;
                    email: string | null;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    notes: string | null;
                    archivedAt: Date | null;
                    ownerId: string;
                    phone: string | null;
                    idNumber: string | null;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
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
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    address: string | null;
                    country: import(".prisma/client").$Enums.Country;
                    emirateOrState: string | null;
                    currency: import(".prisma/client").$Enums.Currency;
                    unitNo: string | null;
                    bedrooms: number | null;
                    status: import(".prisma/client").$Enums.UnitStatus | null;
                    notes: string | null;
                    archivedAt: Date | null;
                    ownerId: string;
                };
                tenant: {
                    id: string;
                    email: string | null;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    notes: string | null;
                    archivedAt: Date | null;
                    ownerId: string;
                    phone: string | null;
                    idNumber: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                archivedAt: Date | null;
                ownerId: string;
                startDate: Date;
                endDate: Date;
                terminationDate: Date | null;
                rentFrequency: import(".prisma/client").$Enums.RentFrequency;
                installmentAmount: import("@prisma/client/runtime/library").Decimal;
                dueDay: number;
                securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
                propertyId: string;
                tenantId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                address: string | null;
                country: import(".prisma/client").$Enums.Country;
                emirateOrState: string | null;
                currency: import(".prisma/client").$Enums.Currency;
                unitNo: string | null;
                bedrooms: number | null;
                status: import(".prisma/client").$Enums.UnitStatus | null;
                notes: string | null;
                archivedAt: Date | null;
                ownerId: string;
            };
            tenant: {
                id: string;
                email: string | null;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                archivedAt: Date | null;
                ownerId: string;
                phone: string | null;
                idNumber: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            archivedAt: Date | null;
            ownerId: string;
            startDate: Date;
            endDate: Date;
            terminationDate: Date | null;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
            propertyId: string;
            tenantId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ScheduleStatus;
        dueDate: Date;
        expectedAmount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal | null;
        leaseId: string;
    })[]>;
}
