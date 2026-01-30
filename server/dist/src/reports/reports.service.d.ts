import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    dashboard(ownerId: string, propertyId?: string): Promise<{
        month: {
            expected: number;
            received: number;
        };
        quarter: {
            expected: number;
            received: number;
        };
        overdueAmount: number;
        overdueSchedules: ({
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
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                ownerId: string;
                propertyId: string;
                startDate: Date;
                endDate: Date;
                rentFrequency: import(".prisma/client").$Enums.RentFrequency;
                installmentAmount: import("@prisma/client/runtime/library").Decimal;
                dueDay: number;
                securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
                unitId: string;
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
        upcomingCheques: ({
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
                installmentAmount: import("@prisma/client/runtime/library").Decimal;
                dueDay: number;
                securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
                unitId: string;
                tenantId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            status: import(".prisma/client").$Enums.ChequeStatus;
            propertyId: string;
            unitId: string;
            tenantId: string;
            leaseId: string;
            replacedByChequeId: string | null;
            chequeNumber: string;
            bankName: string;
            chequeDate: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            coversPeriod: string;
            depositDate: Date | null;
            clearedOrBounceDate: Date | null;
            bounceReason: string | null;
        })[];
        bouncedCount: number;
        unitStats: {
            vacant: number;
            occupied: number;
        };
        expiringLeases: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            ownerId: string;
            propertyId: string;
            startDate: Date;
            endDate: Date;
            rentFrequency: import(".prisma/client").$Enums.RentFrequency;
            installmentAmount: import("@prisma/client/runtime/library").Decimal;
            dueDay: number;
            securityDeposit: import("@prisma/client/runtime/library").Decimal | null;
            unitId: string;
            tenantId: string;
        })[];
    }>;
    chequesCsv(ownerId: string, propertyId?: string, from?: string, to?: string): Promise<string>;
    rentScheduleCsv(ownerId: string, propertyId?: string, from?: string, to?: string): Promise<string>;
}
