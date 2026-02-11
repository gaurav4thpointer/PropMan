import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchPaymentDto } from './dto/match-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { User } from '@prisma/client';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    create(user: User, dto: CreatePaymentDto): Promise<({
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            };
        } & {
            id: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
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
    findAll(user: User, query: PaymentQueryDto): Promise<{
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
                installmentAmount: import("@prisma/client/runtime/library").Decimal;
                dueDay: number;
                securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
    findOne(user: User, id: string): Promise<{
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            };
        } & {
            id: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
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
    matchToSchedule(user: User, id: string, dto: MatchPaymentDto): Promise<{
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
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
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
                expectedAmount: import("@prisma/client/runtime/library").Decimal;
                paidAmount: import("@prisma/client/runtime/library").Decimal | null;
            };
        } & {
            id: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
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
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
