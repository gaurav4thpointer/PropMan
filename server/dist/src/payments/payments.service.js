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
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        await this.ensureLeaseOwned(ownerId, dto.leaseId);
        return this.prisma.payment.create({
            data: {
                ownerId,
                leaseId: dto.leaseId,
                tenantId: dto.tenantId,
                propertyId: dto.propertyId,
                unitId: dto.unitId,
                date: new Date(dto.date),
                amount: new library_1.Decimal(dto.amount),
                method: dto.method,
                reference: dto.reference,
                notes: dto.notes,
                chequeId: dto.chequeId,
            },
            include: { lease: true, tenant: true, property: true, unit: true },
        });
    }
    async findAll(ownerId, pagination, leaseId) {
        const { page = 1, limit = 20 } = pagination;
        const where = { ownerId, ...(leaseId && { leaseId }) };
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: { lease: true, tenant: true, property: true, unit: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { date: 'desc' },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(ownerId, id) {
        const payment = await this.prisma.payment.findFirst({
            where: { id, ownerId },
            include: { lease: true, tenant: true, property: true, unit: true, scheduleMatches: { include: { rentSchedule: true } } },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async matchToSchedule(ownerId, paymentId, matches) {
        const payment = await this.findOne(ownerId, paymentId);
        const totalPayment = Number(payment.amount);
        let applied = 0;
        for (const m of matches) {
            const schedule = await this.prisma.rentSchedule.findFirst({
                where: { id: m.rentScheduleId, lease: { ownerId } },
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
        for (const rentScheduleId of scheduleIds) {
            const schedule = await this.prisma.rentSchedule.findUnique({ where: { id: rentScheduleId } });
            if (!schedule)
                continue;
            const expected = Number(schedule.expectedAmount);
            const agg = await this.prisma.paymentScheduleMatch.aggregate({
                where: { rentScheduleId },
                _sum: { amount: true },
            });
            const totalPaid = Number(agg._sum.amount ?? 0);
            let status = totalPaid >= expected ? client_1.ScheduleStatus.PAID : totalPaid > 0 ? client_1.ScheduleStatus.PARTIAL : new Date(schedule.dueDate) < new Date() ? client_1.ScheduleStatus.OVERDUE : client_1.ScheduleStatus.DUE;
            await this.prisma.rentSchedule.update({
                where: { id: rentScheduleId },
                data: {
                    status,
                    paidAmount: totalPaid > 0 ? new library_1.Decimal(totalPaid) : null,
                },
            });
        }
        return this.findOne(ownerId, paymentId);
    }
    async remove(ownerId, id) {
        const payment = await this.findOne(ownerId, id);
        await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId: id } });
        await this.prisma.payment.delete({ where: { id } });
        return { deleted: true };
    }
    async ensureLeaseOwned(ownerId, leaseId) {
        const lease = await this.prisma.lease.findFirst({ where: { id: leaseId, ownerId } });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map