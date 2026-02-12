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
    }>;
    findAll(user: User, query: LeaseQueryDto): Promise<{
        data: ({
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
    }>;
    getCascadeInfo(user: User, id: string): Promise<{
        cheques: number;
        payments: number;
        schedules: number;
        documents: number;
    }>;
    terminateEarly(user: User, id: string, dto: TerminateLeaseDto): Promise<{
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
    }>;
    archive(user: User, id: string): Promise<{
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
    }>;
    restore(user: User, id: string): Promise<{
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
    }>;
    update(user: User, id: string, dto: UpdateLeaseDto): Promise<{
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
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
