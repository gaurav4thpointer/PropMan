import { Response } from 'express';
import { ReportsService } from './reports.service';
import { User } from '@prisma/client';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    dashboard(user: User, propertyId?: string): Promise<{
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
            status: import(".prisma/client").$Enums.ChequeStatus;
            notes: string | null;
            archivedAt: Date | null;
            ownerId: string;
            propertyId: string;
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
        totalTrackedExpected: number;
        totalTrackedReceived: number;
        totalChequeValueTracked: number;
        totalSecurityDepositsTracked: number;
    }>;
    managerPortfolio(user: User): Promise<{
        owners: {
            owner: {
                id: string;
                name: string | null;
                email: string;
            };
            propertyCount: number;
            month: {
                expected: number;
                received: number;
            };
            quarter: {
                expected: number;
                received: number;
            };
            overdueAmount: number;
            overdueCount: number;
            bouncedCount: number;
            vacantCount: number;
            occupiedCount: number;
            expiringLeasesCount: number;
            needsAttention: boolean;
        }[];
    }>;
    chequesCsv(user: User, res: Response, propertyId?: string, ownerId?: string, from?: string, to?: string): Promise<void>;
    rentScheduleCsv(user: User, res: Response, propertyId?: string, ownerId?: string, from?: string, to?: string): Promise<void>;
}
