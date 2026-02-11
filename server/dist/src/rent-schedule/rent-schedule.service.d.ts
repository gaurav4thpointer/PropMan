import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class RentScheduleService {
    private prisma;
    private accessService;
    constructor(prisma: PrismaService, accessService: AccessService);
    findByLease(userId: string, role: UserRole, leaseId: string, pagination: PaginationDto): Promise<{
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
                    ownerId: string;
                };
                tenant: {
                    id: string;
                    email: string | null;
                    name: string;
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
    findOverdue(userId: string, role: UserRole, propertyId?: string, pagination?: PaginationDto): Promise<{
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
                    ownerId: string;
                };
                tenant: {
                    id: string;
                    email: string | null;
                    name: string;
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
                notes: string | null;
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
    findOutstanding(userId: string, role: UserRole, propertyId?: string, from?: string, to?: string): Promise<({
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
                ownerId: string;
            };
            tenant: {
                id: string;
                email: string | null;
                name: string;
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
            notes: string | null;
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
