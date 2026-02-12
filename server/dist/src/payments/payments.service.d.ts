import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchScheduleItemDto } from './dto/match-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class PaymentsService {
    private prisma;
    private accessService;
    constructor(prisma: PrismaService, accessService: AccessService);
    create(userId: string, role: UserRole, dto: CreatePaymentDto): Promise<({
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
        lease: {
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
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
            propertyId: string;
            tenantId: string;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: Prisma.Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        archivedAt: Date | null;
        ownerId: string;
        propertyId: string;
        tenantId: string;
        leaseId: string;
        amount: Prisma.Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }) | null>;
    findAll(userId: string, role: UserRole, pagination: PaginationDto, filters?: {
        leaseId?: string;
        propertyId?: string;
        tenantId?: string;
        search?: string;
        includeArchived?: boolean;
    }): Promise<{
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
            lease: {
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
                installmentAmount: Prisma.Decimal;
                dueDay: number;
                securityDeposit: Prisma.Decimal | null;
                propertyId: string;
                tenantId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            archivedAt: Date | null;
            ownerId: string;
            propertyId: string;
            tenantId: string;
            leaseId: string;
            amount: Prisma.Decimal;
            date: Date;
            method: import(".prisma/client").$Enums.PaymentMethod;
            reference: string | null;
            chequeId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(userId: string, role: UserRole, id: string): Promise<{
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
        lease: {
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
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
            propertyId: string;
            tenantId: string;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: Prisma.Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        archivedAt: Date | null;
        ownerId: string;
        propertyId: string;
        tenantId: string;
        leaseId: string;
        amount: Prisma.Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    matchToSchedule(userId: string, role: UserRole, paymentId: string, matches: MatchScheduleItemDto[]): Promise<{
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
        lease: {
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
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
            propertyId: string;
            tenantId: string;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: Prisma.Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        archivedAt: Date | null;
        ownerId: string;
        propertyId: string;
        tenantId: string;
        leaseId: string;
        amount: Prisma.Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    remove(userId: string, role: UserRole, id: string): Promise<{
        deleted: boolean;
    }>;
    private autoMatchPayment;
    private recalcScheduleStatuses;
    private ensureLeaseAccessible;
}
