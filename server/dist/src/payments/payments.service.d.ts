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
        lease: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            propertyId: string;
            ownerId: string;
            startDate: Date;
            endDate: Date;
            terminationDate: Date | null;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
        };
        tenant: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            phone: string | null;
            email: string | null;
            idNumber: string | null;
        };
        property: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                leaseId: string;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
            };
        } & {
            id: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
        chequeId: string | null;
    }) | null>;
    findAll(userId: string, role: UserRole, pagination: PaginationDto, filters?: {
        leaseId?: string;
        propertyId?: string;
        tenantId?: string;
        search?: string;
    }): Promise<{
        data: ({
            lease: {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                propertyId: string;
                ownerId: string;
                startDate: Date;
                endDate: Date;
                terminationDate: Date | null;
                rentFrequency: import(".prisma/client").$Enums.RentFrequency;
                installmentAmount: Prisma.Decimal;
                dueDay: number;
                securityDeposit: Prisma.Decimal | null;
            };
            tenant: {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                ownerId: string;
                name: string;
                phone: string | null;
                email: string | null;
                idNumber: string | null;
            };
            property: {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                ownerId: string;
                name: string;
                address: string | null;
                country: import(".prisma/client").$Enums.Country;
                emirateOrState: string | null;
                currency: import(".prisma/client").$Enums.Currency;
                unitNo: string | null;
                bedrooms: number | null;
                status: import(".prisma/client").$Enums.UnitStatus | null;
            };
        } & {
            id: string;
            date: Date;
            amount: Prisma.Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            reference: string | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            leaseId: string;
            tenantId: string;
            propertyId: string;
            ownerId: string;
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
        lease: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            propertyId: string;
            ownerId: string;
            startDate: Date;
            endDate: Date;
            terminationDate: Date | null;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
        };
        tenant: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            phone: string | null;
            email: string | null;
            idNumber: string | null;
        };
        property: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                leaseId: string;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
            };
        } & {
            id: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
        chequeId: string | null;
    }>;
    matchToSchedule(userId: string, role: UserRole, paymentId: string, matches: MatchScheduleItemDto[]): Promise<{
        lease: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            propertyId: string;
            ownerId: string;
            startDate: Date;
            endDate: Date;
            terminationDate: Date | null;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Prisma.Decimal;
            dueDay: number;
            securityDeposit: Prisma.Decimal | null;
        };
        tenant: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            phone: string | null;
            email: string | null;
            idNumber: string | null;
        };
        property: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            name: string;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            unitNo: string | null;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus | null;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                leaseId: string;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Prisma.Decimal;
                paidAmount: Prisma.Decimal | null;
            };
        } & {
            id: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: Prisma.Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
        chequeId: string | null;
    }>;
    remove(userId: string, role: UserRole, id: string): Promise<{
        deleted: boolean;
    }>;
    private autoMatchPayment;
    private recalcScheduleStatuses;
    private ensureLeaseAccessible;
}
