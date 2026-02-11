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
exports.ChequesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_2 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const VALID_TRANSITIONS = {
    [client_2.ChequeStatus.RECEIVED]: [client_2.ChequeStatus.DEPOSITED],
    [client_2.ChequeStatus.DEPOSITED]: [client_2.ChequeStatus.CLEARED, client_2.ChequeStatus.BOUNCED],
    [client_2.ChequeStatus.CLEARED]: [],
    [client_2.ChequeStatus.BOUNCED]: [client_2.ChequeStatus.REPLACED],
    [client_2.ChequeStatus.REPLACED]: [],
};
let ChequesService = class ChequesService {
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
    }
    async create(userId, role, dto) {
        const lease = await this.ensureLeaseAccessible(userId, role, dto.leaseId);
        const ownerId = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN ? userId : lease.ownerId;
        return this.prisma.cheque.create({
            data: {
                ownerId,
                leaseId: dto.leaseId,
                tenantId: dto.tenantId,
                propertyId: dto.propertyId,
                chequeNumber: dto.chequeNumber,
                bankName: dto.bankName,
                chequeDate: new Date(dto.chequeDate),
                amount: new library_1.Decimal(dto.amount),
                coversPeriod: dto.coversPeriod,
                status: client_2.ChequeStatus.RECEIVED,
                notes: dto.notes,
            },
            include: { lease: true, tenant: true, property: true },
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
        if (filters?.propertyId)
            where.propertyId = filters.propertyId;
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.status)
            where.status = filters.status;
        if (filters?.search?.trim()) {
            const q = filters.search.trim();
            where.OR = [
                { chequeNumber: { contains: q, mode: 'insensitive' } },
                { bankName: { contains: q, mode: 'insensitive' } },
                { coversPeriod: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.cheque.findMany({
                where: where,
                include: { lease: true, tenant: true, property: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { chequeDate: 'asc' },
            }),
            this.prisma.cheque.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const cheque = await this.prisma.cheque.findUnique({
            where: { id },
            include: {
                lease: true,
                tenant: true,
                property: true,
                replacedBy: true,
                replacesCheque: true,
            },
        });
        if (!cheque)
            throw new common_1.NotFoundException('Cheque not found');
        const canAccess = await this.accessService.canAccessProperty(userId, role, cheque.propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Cheque not found');
        return cheque;
    }
    async update(userId, role, id, dto) {
        await this.findOne(userId, role, id);
        const data = {};
        if (dto.depositDate != null)
            data.depositDate = new Date(dto.depositDate);
        if (dto.clearedOrBounceDate != null)
            data.clearedOrBounceDate = new Date(dto.clearedOrBounceDate);
        if (dto.bounceReason != null)
            data.bounceReason = dto.bounceReason;
        if (dto.notes !== undefined)
            data.notes = dto.notes;
        if (dto.status != null) {
            const cheque = await this.prisma.cheque.findUnique({ where: { id } });
            this.assertValidTransition(cheque.status, dto.status, undefined);
            data.status = dto.status;
        }
        return this.prisma.cheque.update({
            where: { id },
            data,
            include: { lease: true, tenant: true, property: true },
        });
    }
    async updateStatus(userId, role, id, dto) {
        const cheque = await this.findOne(userId, role, id);
        this.assertValidTransition(cheque.status, dto.status, dto.replacedByChequeId);
        const data = { status: dto.status };
        if (dto.depositDate)
            data.depositDate = new Date(dto.depositDate);
        if (dto.clearedOrBounceDate)
            data.clearedOrBounceDate = new Date(dto.clearedOrBounceDate);
        if (dto.bounceReason)
            data.bounceReason = dto.bounceReason;
        if (dto.replacedByChequeId)
            data.replacedByChequeId = dto.replacedByChequeId;
        return this.prisma.cheque.update({
            where: { id },
            data,
            include: { lease: true, tenant: true, property: true },
        });
    }
    async upcoming(userId, role, days, propertyId) {
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + days);
        const where = role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN
            ? { ownerId: userId, chequeDate: { gte: from, lte: to } }
            : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, chequeDate: { gte: from, lte: to } };
        if (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN && where.propertyId.in.length === 0) {
            return [];
        }
        if (propertyId)
            where.propertyId = propertyId;
        return this.prisma.cheque.findMany({
            where,
            include: { lease: true, tenant: true, property: true },
            orderBy: { chequeDate: 'asc' },
        });
    }
    async remove(userId, role, id) {
        await this.findOne(userId, role, id);
        await this.prisma.cheque.delete({ where: { id } });
        return { deleted: true };
    }
    assertValidTransition(current, next, replacedByChequeId) {
        const allowed = VALID_TRANSITIONS[current];
        if (!allowed?.includes(next))
            throw new common_1.BadRequestException(`Invalid status transition from ${current} to ${next}`);
        if (next === client_2.ChequeStatus.REPLACED && !replacedByChequeId)
            throw new common_1.BadRequestException('replacedByChequeId required when status is REPLACED');
    }
    async ensureLeaseAccessible(userId, role, leaseId) {
        const lease = await this.prisma.lease.findUnique({ where: { id: leaseId }, include: { property: true } });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
        if (!canAccess)
            throw new common_1.NotFoundException('Lease not found');
        return lease;
    }
};
exports.ChequesService = ChequesService;
exports.ChequesService = ChequesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], ChequesService);
//# sourceMappingURL=cheques.service.js.map