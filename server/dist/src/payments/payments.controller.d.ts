import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchPaymentDto } from './dto/match-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { User } from '@prisma/client';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    create(user: User, dto: CreatePaymentDto): Promise<{
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        chequeId: string | null;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
    }>;
    findAll(user: User, query: PaymentQueryDto): Promise<{
        data: ({
            lease: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            reference: string | null;
            notes: string | null;
            chequeId: string | null;
            leaseId: string;
            tenantId: string;
            propertyId: string;
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
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
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
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        chequeId: string | null;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
    }>;
    matchToSchedule(user: User, id: string, dto: MatchPaymentDto): Promise<{
        lease: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
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
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            rentScheduleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string | null;
        notes: string | null;
        chequeId: string | null;
        leaseId: string;
        tenantId: string;
        propertyId: string;
        ownerId: string;
    }>;
    remove(user: User, id: string): Promise<{
        deleted: boolean;
    }>;
}
