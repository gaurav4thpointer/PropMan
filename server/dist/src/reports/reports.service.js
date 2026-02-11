"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const client_2 = require("@prisma/client");
let ReportsService = class ReportsService {
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
    }
    async dashboard(userId, role, propertyId) {
        const accessibleIds = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? [] : await this.accessService.getAccessiblePropertyIds(userId, role);
        if (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN && accessibleIds.length === 0) {
            return this.emptyDashboardResponse();
        }
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        const leaseWhere = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, ...(propertyId && { propertyId }) }
            : { propertyId: propertyId ? propertyId : { in: accessibleIds } };
        if (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN && propertyId) {
            if (!accessibleIds.includes(propertyId)) {
                return this.emptyDashboardResponse();
            }
        }
        const expiryEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const propertyWhere = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, ...(propertyId && { id: propertyId }) }
            : { id: propertyId ? propertyId : { in: accessibleIds } };
        const [monthExpected, monthPaid, quarterExpected, quarterPaid, overdueSchedules, upcomingCheques, bouncedCount, vacantCount, occupiedCount, expiringLeases] = await Promise.all([
            this.prisma.rentSchedule.aggregate({
                where: {
                    lease: leaseWhere,
                    dueDate: { gte: monthStart, lte: monthEnd },
                },
                _sum: { expectedAmount: true },
            }),
            this.prisma.rentSchedule.aggregate({
                where: {
                    lease: leaseWhere,
                    dueDate: { gte: monthStart, lte: monthEnd },
                    status: client_2.ScheduleStatus.PAID,
                },
                _sum: { expectedAmount: true },
            }),
            this.prisma.rentSchedule.aggregate({
                where: {
                    lease: leaseWhere,
                    dueDate: { gte: quarterStart, lte: quarterEnd },
                },
                _sum: { expectedAmount: true },
            }),
            this.prisma.rentSchedule.aggregate({
                where: {
                    lease: leaseWhere,
                    dueDate: { gte: quarterStart, lte: quarterEnd },
                    status: client_2.ScheduleStatus.PAID,
                },
                _sum: { expectedAmount: true },
            }),
            this.prisma.rentSchedule.findMany({
                where: {
                    lease: leaseWhere,
                    status: { in: [client_2.ScheduleStatus.DUE, client_2.ScheduleStatus.PARTIAL] },
                    dueDate: { lt: now },
                },
                include: { lease: { include: { property: true, tenant: true } } },
                orderBy: { dueDate: 'asc' },
                take: 50,
            }),
            this.prisma.cheque.findMany({
                where: {
                    ...(role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
                    ...(propertyId && (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) ? { propertyId } : {}),
                    chequeDate: { gte: now, lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
                },
                include: { lease: true, tenant: true, property: true },
                orderBy: { chequeDate: 'asc' },
                take: 20,
            }),
            this.prisma.cheque.count({
                where: {
                    ...(role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
                    status: client_2.ChequeStatus.BOUNCED,
                },
            }),
            this.prisma.property.count({ where: { ...propertyWhere, status: 'VACANT' } }),
            this.prisma.property.count({ where: { ...propertyWhere, status: 'OCCUPIED' } }),
            this.prisma.lease.findMany({
                where: {
                    ...(role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
                    endDate: { gte: now, lte: expiryEnd },
                },
                include: { property: true, tenant: true },
                orderBy: { endDate: 'asc' },
                take: 20,
            }),
        ]);
        const paymentWhere = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, ...(propertyId && { propertyId }) }
            : { propertyId: propertyId ?? { in: accessibleIds } };
        const chequeWhere = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, ...(propertyId && { propertyId }) }
            : { propertyId: propertyId ?? { in: accessibleIds } };
        const leaseWhereForDeposits = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, ...(propertyId && { propertyId }) }
            : { propertyId: propertyId ?? { in: accessibleIds } };
        const [overdueAmount, totalTrackedExpected, totalTrackedReceived, totalChequeValueTracked, totalSecurityDepositsTracked] = await Promise.all([
            this.prisma.rentSchedule.aggregate({
                where: {
                    lease: leaseWhere,
                    status: { in: [client_2.ScheduleStatus.DUE, client_2.ScheduleStatus.PARTIAL] },
                    dueDate: { lt: now },
                },
                _sum: { expectedAmount: true },
            }),
            this.prisma.rentSchedule.aggregate({
                where: { lease: leaseWhere },
                _sum: { expectedAmount: true },
            }),
            this.prisma.payment.aggregate({
                where: paymentWhere,
                _sum: { amount: true },
            }),
            this.prisma.cheque.aggregate({
                where: chequeWhere,
                _sum: { amount: true },
            }),
            this.prisma.lease.aggregate({
                where: leaseWhereForDeposits,
                _sum: { securityDeposit: true },
            }),
        ]);
        const monthExpectedVal = Number(monthExpected._sum.expectedAmount ?? 0);
        const monthPaidVal = Number(monthPaid._sum.expectedAmount ?? 0);
        const quarterExpectedVal = Number(quarterExpected._sum.expectedAmount ?? 0);
        const quarterPaidVal = Number(quarterPaid._sum.expectedAmount ?? 0);
        return {
            month: { expected: monthExpectedVal, received: monthPaidVal },
            quarter: { expected: quarterExpectedVal, received: quarterPaidVal },
            overdueAmount: Number(overdueAmount._sum.expectedAmount ?? 0),
            overdueSchedules,
            upcomingCheques,
            bouncedCount,
            unitStats: { vacant: vacantCount, occupied: occupiedCount },
            expiringLeases,
            totalTrackedExpected: Number(totalTrackedExpected._sum.expectedAmount ?? 0),
            totalTrackedReceived: Number(totalTrackedReceived._sum.amount ?? 0),
            totalChequeValueTracked: Number(totalChequeValueTracked._sum.amount ?? 0),
            totalSecurityDepositsTracked: Number(totalSecurityDepositsTracked._sum.securityDeposit ?? 0),
        };
    }
    emptyDashboardResponse() {
        return {
            month: { expected: 0, received: 0 },
            quarter: { expected: 0, received: 0 },
            overdueAmount: 0,
            overdueSchedules: [],
            upcomingCheques: [],
            bouncedCount: 0,
            unitStats: { vacant: 0, occupied: 0 },
            expiringLeases: [],
            totalTrackedExpected: 0,
            totalTrackedReceived: 0,
            totalChequeValueTracked: 0,
            totalSecurityDepositsTracked: 0,
        };
    }
    async chequesCsv(userId, role, propertyId, from, to) {
        const where = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
        if (propertyId)
            where.propertyId = propertyId;
        if (from || to) {
            where.chequeDate = {};
            if (from)
                where.chequeDate.gte = new Date(from);
            if (to)
                where.chequeDate.lte = new Date(to);
        }
        const rows = await this.prisma.cheque.findMany({
            where,
            include: { tenant: true, property: true },
            orderBy: { chequeDate: 'asc' },
        });
        const headers = ['id', 'chequeNumber', 'bankName', 'chequeDate', 'amount', 'coversPeriod', 'status', 'depositDate', 'clearedOrBounceDate', 'bounceReason', 'tenantName', 'propertyName', 'unitNo'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const row = [
                r.id,
                r.chequeNumber,
                r.bankName,
                r.chequeDate.toISOString().slice(0, 10),
                r.amount.toString(),
                `"${(r.coversPeriod || '').replace(/"/g, '""')}"`,
                r.status,
                r.depositDate?.toISOString().slice(0, 10) ?? '',
                r.clearedOrBounceDate?.toISOString().slice(0, 10) ?? '',
                `"${(r.bounceReason || '').replace(/"/g, '""')}"`,
                `"${(r.tenant?.name ?? '').replace(/"/g, '""')}"`,
                `"${(r.property?.name ?? '').replace(/"/g, '""')}"`,
                r.property?.unitNo ?? '',
            ];
            lines.push(row.join(','));
        }
        return lines.join('\n');
    }
    async rentScheduleCsv(userId, role, propertyId, from, to) {
        const leaseWhere = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
        if (propertyId)
            leaseWhere.propertyId = propertyId;
        const dueDateFilter = {};
        if (from)
            dueDateFilter.gte = new Date(from);
        if (to)
            dueDateFilter.lte = new Date(to);
        const rows = await this.prisma.rentSchedule.findMany({
            where: {
                lease: leaseWhere,
                ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
            },
            include: { lease: { include: { property: true, tenant: true } } },
            orderBy: { dueDate: 'asc' },
        });
        const headers = ['id', 'dueDate', 'expectedAmount', 'paidAmount', 'status', 'leaseId', 'tenantName', 'propertyName', 'unitNo'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const row = [
                r.id,
                r.dueDate.toISOString().slice(0, 10),
                r.expectedAmount.toString(),
                r.paidAmount?.toString() ?? '',
                r.status,
                r.leaseId,
                `"${(r.lease?.tenant?.name || '').replace(/"/g, '""')}"`,
                `"${(r.lease?.property?.name || '').replace(/"/g, '""')}"`,
                r.lease?.property?.unitNo ?? '',
            ];
            lines.push(row.join(','));
        }
        return lines.join('\n');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map