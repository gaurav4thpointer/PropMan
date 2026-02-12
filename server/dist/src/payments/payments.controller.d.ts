import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchPaymentDto } from './dto/match-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { User } from '@prisma/client';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    create(user: User, dto: CreatePaymentDto): Promise<({
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }) | null>;
    findAll(user: User, query: PaymentQueryDto): Promise<{
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
            notes: string | null;
            archivedAt: Date | null;
            ownerId: string;
            propertyId: string;
            tenantId: string;
            leaseId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    matchToSchedule(user: User, id: string, dto: MatchPaymentDto): Promise<{
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
                leaseId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        chequeId: string | null;
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
