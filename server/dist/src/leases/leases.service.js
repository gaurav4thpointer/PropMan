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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_2 = require("@prisma/client");
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
    if (frequency === client_2.RentFrequency.QUARTERLY)
        stepMonths = 3;
    else if (frequency === client_2.RentFrequency.YEARLY)
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
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
    }
    async create(userId, role, dto) {
        await this.ensurePropertyAndTenantAccessible(userId, role, dto.propertyId, dto.tenantId);
        await this.checkNoOverlappingLease(dto.propertyId, dto.startDate, dto.endDate, null);
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (end <= start)
            throw new common_1.BadRequestException('endDate must be after startDate');
        const property = await this.prisma.property.findUniqueOrThrow({
            where: { id: dto.propertyId },
            select: { ownerId: true },
        });
        const ownerId = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? userId : property.ownerId;
        const lease = await this.prisma.lease.create({
            data: {
                ownerId,
                propertyId: dto.propertyId,
                tenantId: dto.tenantId,
                startDate: start,
                endDate: end,
                rentFrequency: dto.rentFrequency,
                installmentAmount: new library_1.Decimal(dto.installmentAmount),
                dueDay: dto.dueDay,
                securityDeposit: dto.securityDeposit != null ? new library_1.Decimal(dto.securityDeposit) : null,
                notes: dto.notes,
            },
            include: { property: true, tenant: true },
        });
        await this.generateRentSchedule(lease.id, start, end, dto.dueDay, dto.rentFrequency, new library_1.Decimal(dto.installmentAmount));
        await this.prisma.property.update({ where: { id: dto.propertyId }, data: { status: client_2.UnitStatus.OCCUPIED } });
        return this.findOne(userId, role, lease.id);
    }
    async findAll(userId, role, pagination, filters) {
        const { page = 1, limit = 20 } = pagination;
        const where = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId }
            : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
        if (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN && where.propertyId.in.length === 0) {
            return (0, pagination_dto_1.paginatedResponse)([], 0, page, limit);
        }
        if (filters?.propertyId) {
            if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
                where.propertyId = filters.propertyId;
            }
            else {
                const ids = where.propertyId.in;
                if (!ids.includes(filters.propertyId))
                    return (0, pagination_dto_1.paginatedResponse)([], 0, page, limit);
                where.propertyId = filters.propertyId;
            }
        }
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.search?.trim()) {
            const q = filters.search.trim();
            where.OR = [
                { tenant: { name: { contains: q, mode: 'insensitive' } } },
                { property: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.lease.findMany({
                where: where,
                include: { property: true, tenant: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { startDate: 'desc' },
            }),
            this.prisma.lease.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const lease = await this.prisma.lease.findUnique({
            where: { id },
            include: {
                property: true,
                tenant: true,
                rentSchedules: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
    async update(userId, role, id, dto) {
        const existing = await this.findOne(userId, role, id);
        const propertyId = dto.propertyId ?? existing.propertyId;
        const tenantId = dto.tenantId ?? existing.tenantId;
        const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
        const dueDay = dto.dueDay ?? existing.dueDay;
        const frequency = dto.rentFrequency ?? existing.rentFrequency;
        const amount = dto.installmentAmount != null ? new library_1.Decimal(dto.installmentAmount) : existing.installmentAmount;
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('endDate must be after startDate');
        }
        await this.ensurePropertyAndTenantAccessible(userId, role, propertyId, tenantId);
        await this.checkNoOverlappingLease(propertyId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10), id);
        const updated = await this.prisma.lease.update({
            where: { id },
            data: {
                ...(dto.propertyId && { propertyId: dto.propertyId }),
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
        if (dto.propertyId && existing.propertyId !== dto.propertyId) {
            await this.setPropertyVacantIfNoActiveLease(existing.propertyId, id);
            await this.prisma.property.update({ where: { id: dto.propertyId }, data: { status: client_2.UnitStatus.OCCUPIED } });
        }
        return this.findOne(userId, role, id);
    }
    async remove(userId, role, id) {
        const lease = await this.findOne(userId, role, id);
        const propertyId = lease.propertyId;
        await this.prisma.lease.delete({ where: { id } });
        await this.setPropertyVacantIfNoActiveLease(propertyId, null);
        return { deleted: true };
    }
    async setPropertyVacantIfNoActiveLease(propertyId, excludeLeaseId) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const leases = await this.prisma.lease.findMany({
            where: {
                propertyId,
                ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
                endDate: { gte: now },
            },
            select: { id: true, endDate: true, terminationDate: true },
        });
        const active = leases.some((l) => {
            const end = new Date(l.endDate);
            end.setHours(0, 0, 0, 0);
            if (end < now)
                return false;
            if (l.terminationDate == null)
                return true;
            const term = new Date(l.terminationDate);
            term.setHours(0, 0, 0, 0);
            return term > now;
        });
        if (!active) {
            await this.prisma.property.update({ where: { id: propertyId }, data: { status: client_2.UnitStatus.VACANT } });
        }
    }
    async terminateEarly(userId, role, id, dto) {
        const lease = await this.findOne(userId, role, id);
        const start = new Date(lease.startDate);
        const end = new Date(lease.endDate);
        const term = new Date(dto.terminationDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        term.setHours(0, 0, 0, 0);
        if (term < start)
            throw new common_1.BadRequestException('terminationDate must be on or after lease startDate');
        if (term > end)
            throw new common_1.BadRequestException('terminationDate must be on or before lease endDate');
        if (lease.terminationDate)
            throw new common_1.BadRequestException('Lease is already terminated');
        await this.prisma.lease.update({
            where: { id },
            data: { terminationDate: term },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (term <= today) {
            await this.setPropertyVacantIfNoActiveLease(lease.propertyId, null);
        }
        return this.findOne(userId, role, id);
    }
    async ensurePropertyAndTenantAccessible(userId, role, propertyId, tenantId) {
        const canAccess = await this.accessService.canAccessProperty(userId, role, propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Property not found');
        const property = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        const tenant = await this.prisma.tenant.findFirst({
            where: { id: tenantId, ownerId: property.ownerId },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
    }
    async checkNoOverlappingLease(propertyId, start, end, excludeLeaseId) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const overlapping = await this.prisma.lease.findFirst({
            where: {
                propertyId,
                ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });
        if (overlapping)
            throw new common_1.BadRequestException('Property already has an overlapping active lease');
    }
    async generateRentSchedule(leaseId, startDate, endDate, dueDay, frequency, amount) {
        const freq = frequency === client_2.RentFrequency.CUSTOM ? client_2.RentFrequency.MONTHLY : frequency;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], LeasesService);
//# sourceMappingURL=leases.service.js.map