import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';
import { LeaseQueryDto } from './dto/lease-query.dto';
import { User } from '@prisma/client';
export declare class LeasesController {
    private leasesService;
    constructor(leasesService: LeasesService);
    create(user: User, dto: CreateLeaseDto): Promise<{
        property: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
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
        rentSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            leaseId: string;
        }[];
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
    }>;
    findAll(user: User, query: LeaseQueryDto): Promise<{
        data: ({
            property: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                ownerId: string;
                address: string | null;
                country: import(".prisma/client").$Enums.Country;
                emirateOrState: string | null;
                currency: import(".prisma/client").$Enums.Currency;
                unitNo: string | null;
                bedrooms: number | null;
                status: import(".prisma/client").$Enums.UnitStatus | null;
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: User, id: string): Promise<{
        property: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
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
        rentSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            leaseId: string;
        }[];
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
    }>;
    terminateEarly(user: User, id: string, dto: TerminateLeaseDto): Promise<{
        property: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
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
        rentSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            leaseId: string;
        }[];
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
    }>;
    update(user: User, id: string, dto: UpdateLeaseDto): Promise<{
        property: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
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
        rentSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ScheduleStatus;
            dueDate: Date;
            expectedAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            leaseId: string;
        }[];
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
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
