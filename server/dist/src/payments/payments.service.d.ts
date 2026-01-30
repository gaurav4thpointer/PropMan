import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchScheduleItemDto } from './dto/match-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreatePaymentDto): Promise<{
        property: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            notes: string | null;
            ownerId: string;
        };
        unit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
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
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            propertyId: string;
            startDate: Date;
            endDate: Date;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Decimal;
            dueDay: number;
            securityDeposit: Decimal | null;
            unitId: string;
            tenantId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        propertyId: string;
        unitId: string;
        tenantId: string;
        leaseId: string;
        amount: Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    findAll(ownerId: string, pagination: PaginationDto, leaseId?: string): Promise<{
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
                notes: string | null;
                ownerId: string;
            };
            unit: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                unitNo: string;
                bedrooms: number | null;
                status: import(".prisma/client").$Enums.UnitStatus;
                propertyId: string;
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
            lease: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                ownerId: string;
                propertyId: string;
                startDate: Date;
                endDate: Date;
                rentFrequency: import(".prisma/client").$Enums.RentFrequency;
                installmentAmount: Decimal;
                dueDay: number;
                securityDeposit: Decimal | null;
                unitId: string;
                tenantId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            propertyId: string;
            unitId: string;
            tenantId: string;
            leaseId: string;
            amount: Decimal;
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
    findOne(ownerId: string, id: string): Promise<{
        property: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            notes: string | null;
            ownerId: string;
        };
        unit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
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
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            propertyId: string;
            startDate: Date;
            endDate: Date;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Decimal;
            dueDay: number;
            securityDeposit: Decimal | null;
            unitId: string;
            tenantId: string;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Decimal;
                paidAmount: Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        propertyId: string;
        unitId: string;
        tenantId: string;
        leaseId: string;
        amount: Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    matchToSchedule(ownerId: string, paymentId: string, matches: MatchScheduleItemDto[]): Promise<{
        property: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            country: import(".prisma/client").$Enums.Country;
            emirateOrState: string | null;
            currency: import(".prisma/client").$Enums.Currency;
            notes: string | null;
            ownerId: string;
        };
        unit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            unitNo: string;
            bedrooms: number | null;
            status: import(".prisma/client").$Enums.UnitStatus;
            propertyId: string;
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
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            propertyId: string;
            startDate: Date;
            endDate: Date;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: Decimal;
            dueDay: number;
            securityDeposit: Decimal | null;
            unitId: string;
            tenantId: string;
        };
        scheduleMatches: ({
            rentSchedule: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ScheduleStatus;
                dueDate: Date;
                expectedAmount: Decimal;
                paidAmount: Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        ownerId: string;
        propertyId: string;
        unitId: string;
        tenantId: string;
        leaseId: string;
        amount: Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    remove(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    private ensureLeaseOwned;
}
