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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_2 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let PaymentsService = class PaymentsService {
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
    }
    async create(userId, role, dto) {
        const lease = await this.ensureLeaseAccessible(userId, role, dto.leaseId);
        const ownerId = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? userId : lease.ownerId;
        const payment = await this.prisma.payment.create({
            data: {
                ownerId,
                leaseId: dto.leaseId,
                tenantId: dto.tenantId,
                propertyId: dto.propertyId,
                date: new Date(dto.date),
                amount: new library_1.Decimal(dto.amount),
                method: dto.method,
                reference: dto.reference,
                notes: dto.notes,
                chequeId: dto.chequeId,
            },
        });
        await this.autoMatchPayment(payment.id, payment.leaseId, Number(payment.amount));
        return this.prisma.payment.findUnique({
            where: { id: payment.id },
            include: { lease: true, tenant: true, property: true, scheduleMatches: { include: { rentSchedule: true } } },
        });
    }
    async findAll(userId, role, pagination, filters) {
        const { page = 1, limit = 20 } = pagination;
        const where = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId }
            : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
        if (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN && where.propertyId.in.length === 0) {
            return (0, pagination_dto_1.paginatedResponse)([], 0, page, limit);
        }
        if (filters?.leaseId)
            where.leaseId = filters.leaseId;
        if (filters?.propertyId)
            where.propertyId = filters.propertyId;
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.search?.trim()) {
            const q = filters.search.trim();
            where.OR = [
                { reference: { contains: q, mode: 'insensitive' } },
                { tenant: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({
                where: where,
                include: { lease: true, tenant: true, property: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { date: 'desc' },
            }),
            this.prisma.payment.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: { lease: true, tenant: true, property: true, scheduleMatches: { include: { rentSchedule: true } } },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const canAccess = await this.accessService.canAccessProperty(userId, role, payment.propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async matchToSchedule(userId, role, paymentId, matches) {
        const payment = await this.findOne(userId, role, paymentId);
        const totalPayment = Number(payment.amount);
        const accessibleIds = await this.accessService.getAccessiblePropertyIds(userId, role);
        let applied = 0;
        for (const m of matches) {
            const schedule = await this.prisma.rentSchedule.findFirst({
                where: {
                    id: m.rentScheduleId,
                    lease: { propertyId: { in: accessibleIds } },
                },
            });
            if (!schedule)
                throw new common_1.NotFoundException(`RentSchedule ${m.rentScheduleId} not found`);
            if (schedule.leaseId !== payment.leaseId)
                throw new common_1.BadRequestException('RentSchedule must belong to same lease as payment');
            applied += m.amount;
        }
        if (applied > totalPayment)
            throw new common_1.BadRequestException('Total applied amount exceeds payment amount');
        await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId } });
        const scheduleIds = [...new Set(matches.filter((m) => m.amount > 0).map((m) => m.rentScheduleId))];
        for (const m of matches) {
            if (m.amount <= 0)
                continue;
            await this.prisma.paymentScheduleMatch.create({
                data: {
                    paymentId,
                    rentScheduleId: m.rentScheduleId,
                    amount: new library_1.Decimal(m.amount),
                },
            });
        }
        await this.recalcScheduleStatuses(scheduleIds);
        return this.findOne(userId, role, paymentId);
    }
    async remove(userId, role, id) {
        const payment = await this.findOne(userId, role, id);
        await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId: id } });
        await this.prisma.payment.delete({ where: { id } });
        return { deleted: true };
    }
    async autoMatchPayment(paymentId, leaseId, paymentAmount) {
        const schedules = await this.prisma.rentSchedule.findMany({
            where: { leaseId },
            orderBy: { dueDate: 'asc' },
        });
        let remaining = paymentAmount;
        const matches = [];
        for (const schedule of schedules) {
            if (remaining <= 0)
                break;
            const expected = Number(schedule.expectedAmount);
            const agg = await this.prisma.paymentScheduleMatch.aggregate({
                where: { rentScheduleId: schedule.id },
                _sum: { amount: true },
            });
            const alreadyPaid = Number(agg._sum.amount ?? 0);
            const stillOwed = expected - alreadyPaid;
            if (stillOwed <= 0)
                continue;
            const toApply = Math.min(remaining, stillOwed);
            matches.push({ rentScheduleId: schedule.id, amount: toApply });
            remaining -= toApply;
        }
        for (const m of matches) {
            await this.prisma.paymentScheduleMatch.create({
                data: {
                    paymentId,
                    rentScheduleId: m.rentScheduleId,
                    amount: new library_1.Decimal(m.amount),
                },
            });
        }
        await this.recalcScheduleStatuses(matches.map((m) => m.rentScheduleId));
    }
    async recalcScheduleStatuses(scheduleIds) {
        const uniqueIds = [...new Set(scheduleIds)];
        for (const rentScheduleId of uniqueIds) {
            const schedule = await this.prisma.rentSchedule.findUnique({ where: { id: rentScheduleId } });
            if (!schedule)
                continue;
            const expected = Number(schedule.expectedAmount);
            const agg = await this.prisma.paymentScheduleMatch.aggregate({
                where: { rentScheduleId },
                _sum: { amount: true },
            });
            const totalPaid = Number(agg._sum.amount ?? 0);
            const status = totalPaid >= expected
                ? client_2.ScheduleStatus.PAID
                : totalPaid > 0
                    ? client_2.ScheduleStatus.PARTIAL
                    : new Date(schedule.dueDate) < new Date()
                        ? client_2.ScheduleStatus.OVERDUE
                        : client_2.ScheduleStatus.DUE;
            await this.prisma.rentSchedule.update({
                where: { id: rentScheduleId },
                data: {
                    status,
                    paidAmount: totalPaid > 0 ? new library_1.Decimal(totalPaid) : null,
                },
            });
        }
    }
    async ensureLeaseAccessible(userId, role, leaseId) {
        const lease = await this.prisma.lease.findUnique({ where: { id: leaseId } });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map