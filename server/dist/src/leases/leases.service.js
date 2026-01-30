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
exports.LeasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}
function getDueDate(year, month, dueDay) {
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(dueDay, lastDay);
    return new Date(year, month - 1, day);
}
function generateScheduleDates(startDate, endDate, dueDay, frequency) {
    const dates = [];
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    current.setMonth(current.getMonth() - 1);
    let stepMonths = 1;
    if (frequency === client_1.RentFrequency.QUARTERLY)
        stepMonths = 3;
    else if (frequency === client_1.RentFrequency.YEARLY)
        stepMonths = 12;
    while (current <= end) {
        const due = getDueDate(current.getFullYear(), current.getMonth() + 1, dueDay);
        if (due >= startDate && due <= endDate)
            dates.push(due);
        current = addMonths(current, stepMonths);
    }
    return dates;
}
let LeasesService = class LeasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        await this.ensurePropertyUnitTenantOwned(ownerId, dto.propertyId, dto.unitId, dto.tenantId);
        await this.checkNoOverlappingLease(dto.unitId, dto.startDate, dto.endDate, null);
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (end <= start)
            throw new common_1.BadRequestException('endDate must be after startDate');
        const lease = await this.prisma.lease.create({
            data: {
                ownerId,
                propertyId: dto.propertyId,
                unitId: dto.unitId,
                tenantId: dto.tenantId,
                startDate: start,
                endDate: end,
                rentFrequency: dto.rentFrequency,
                installmentAmount: new library_1.Decimal(dto.installmentAmount),
                dueDay: dto.dueDay,
                securityDeposit: dto.securityDeposit != null ? new library_1.Decimal(dto.securityDeposit) : null,
                notes: dto.notes,
            },
            include: { property: true, unit: true, tenant: true },
        });
        await this.generateRentSchedule(lease.id, start, end, dto.dueDay, dto.rentFrequency, new library_1.Decimal(dto.installmentAmount));
        await this.prisma.unit.update({ where: { id: dto.unitId }, data: { status: client_1.UnitStatus.OCCUPIED } });
        return this.findOne(ownerId, lease.id);
    }
    async findAll(ownerId, pagination) {
        const { page = 1, limit = 20 } = pagination;
        const [data, total] = await Promise.all([
            this.prisma.lease.findMany({
                where: { ownerId },
                include: { property: true, unit: true, tenant: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { startDate: 'desc' },
            }),
            this.prisma.lease.count({ where: { ownerId } }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(ownerId, id) {
        const lease = await this.prisma.lease.findFirst({
            where: { id, ownerId },
            include: {
                property: true,
                unit: true,
                tenant: true,
                rentSchedules: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
    async update(ownerId, id, dto) {
        const existing = await this.findOne(ownerId, id);
        const propertyId = dto.propertyId ?? existing.propertyId;
        const unitId = dto.unitId ?? existing.unitId;
        const tenantId = dto.tenantId ?? existing.tenantId;
        const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
        const dueDay = dto.dueDay ?? existing.dueDay;
        const frequency = dto.rentFrequency ?? existing.rentFrequency;
        const amount = dto.installmentAmount != null ? new library_1.Decimal(dto.installmentAmount) : existing.installmentAmount;
        await this.ensurePropertyUnitTenantOwned(ownerId, propertyId, unitId, tenantId);
        await this.checkNoOverlappingLease(unitId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10), id);
        const updated = await this.prisma.lease.update({
            where: { id },
            data: {
                ...(dto.propertyId && { propertyId: dto.propertyId }),
                ...(dto.unitId && { unitId: dto.unitId }),
                ...(dto.tenantId && { tenantId: dto.tenantId }),
                ...(dto.startDate && { startDate: new Date(dto.startDate) }),
                ...(dto.endDate && { endDate: new Date(dto.endDate) }),
                ...(dto.rentFrequency && { rentFrequency: dto.rentFrequency }),
                ...(dto.installmentAmount != null && { installmentAmount: new library_1.Decimal(dto.installmentAmount) }),
                ...(dto.dueDay != null && { dueDay: dto.dueDay }),
                ...(dto.securityDeposit != null && { securityDeposit: new library_1.Decimal(dto.securityDeposit) }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
        });
        await this.prisma.paymentScheduleMatch.deleteMany({
            where: { rentSchedule: { leaseId: id } },
        });
        await this.prisma.rentSchedule.deleteMany({ where: { leaseId: id } });
        await this.generateRentSchedule(updated.id, startDate, endDate, dueDay, frequency, amount);
        if (dto.unitId && existing.unitId !== dto.unitId) {
            await this.setUnitVacantIfNoActiveLease(existing.unitId, id);
            await this.prisma.unit.update({ where: { id: dto.unitId }, data: { status: client_1.UnitStatus.OCCUPIED } });
        }
        return this.findOne(ownerId, id);
    }
    async remove(ownerId, id) {
        const lease = await this.findOne(ownerId, id);
        const unitId = lease.unitId;
        await this.prisma.lease.delete({ where: { id } });
        await this.setUnitVacantIfNoActiveLease(unitId, null);
        return { deleted: true };
    }
    async setUnitVacantIfNoActiveLease(unitId, excludeLeaseId) {
        const now = new Date();
        const active = await this.prisma.lease.findFirst({
            where: {
                unitId,
                ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
                endDate: { gte: now },
            },
        });
        if (!active) {
            await this.prisma.unit.update({ where: { id: unitId }, data: { status: client_1.UnitStatus.VACANT } });
        }
    }
    async ensurePropertyUnitTenantOwned(ownerId, propertyId, unitId, tenantId) {
        const [prop, unit, tenant] = await Promise.all([
            this.prisma.property.findFirst({ where: { id: propertyId, ownerId } }),
            this.prisma.unit.findFirst({ where: { id: unitId, propertyId } }),
            this.prisma.tenant.findFirst({ where: { id: tenantId, ownerId } }),
        ]);
        if (!prop)
            throw new common_1.NotFoundException('Property not found');
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
    }
    async checkNoOverlappingLease(unitId, start, end, excludeLeaseId) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const overlapping = await this.prisma.lease.findFirst({
            where: {
                unitId,
                ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });
        if (overlapping)
            throw new common_1.BadRequestException('Unit already has an overlapping active lease');
    }
    async generateRentSchedule(leaseId, startDate, endDate, dueDay, frequency, amount) {
        const freq = frequency === client_1.RentFrequency.CUSTOM ? client_1.RentFrequency.MONTHLY : frequency;
        const dates = generateScheduleDates(startDate, endDate, dueDay, freq);
        await this.prisma.rentSchedule.createMany({
            data: dates.map((dueDate) => ({
                leaseId,
                dueDate,
                expectedAmount: amount,
                status: 'DUE',
            })),
        });
    }
};
exports.LeasesService = LeasesService;
exports.LeasesService = LeasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeasesService);
//# sourceMappingURL=leases.service.js.map