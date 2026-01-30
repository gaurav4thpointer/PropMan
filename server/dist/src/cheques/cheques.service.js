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
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const VALID_TRANSITIONS = {
    [client_1.ChequeStatus.RECEIVED]: [client_1.ChequeStatus.DEPOSITED],
    [client_1.ChequeStatus.DEPOSITED]: [client_1.ChequeStatus.CLEARED, client_1.ChequeStatus.BOUNCED],
    [client_1.ChequeStatus.CLEARED]: [],
    [client_1.ChequeStatus.BOUNCED]: [client_1.ChequeStatus.REPLACED],
    [client_1.ChequeStatus.REPLACED]: [],
};
let ChequesService = class ChequesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        await this.ensureLeaseOwned(ownerId, dto.leaseId);
        return this.prisma.cheque.create({
            data: {
                ownerId,
                leaseId: dto.leaseId,
                tenantId: dto.tenantId,
                propertyId: dto.propertyId,
                unitId: dto.unitId,
                chequeNumber: dto.chequeNumber,
                bankName: dto.bankName,
                chequeDate: new Date(dto.chequeDate),
                amount: new library_1.Decimal(dto.amount),
                coversPeriod: dto.coversPeriod,
                status: client_1.ChequeStatus.RECEIVED,
                notes: dto.notes,
            },
            include: { lease: true, tenant: true, property: true, unit: true },
        });
    }
    async findAll(ownerId, pagination, filters) {
        const { page = 1, limit = 20 } = pagination;
        const where = { ownerId, ...(filters?.propertyId && { propertyId: filters.propertyId }), ...(filters?.status && { status: filters.status }) };
        const [data, total] = await Promise.all([
            this.prisma.cheque.findMany({
                where,
                include: { lease: true, tenant: true, property: true, unit: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { chequeDate: 'asc' },
            }),
            this.prisma.cheque.count({ where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(ownerId, id) {
        const cheque = await this.prisma.cheque.findFirst({
            where: { id, ownerId },
            include: { lease: true, tenant: true, property: true, unit: true },
        });
        if (!cheque)
            throw new common_1.NotFoundException('Cheque not found');
        return cheque;
    }
    async update(ownerId, id, dto) {
        await this.findOne(ownerId, id);
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
            include: { lease: true, tenant: true, property: true, unit: true },
        });
    }
    async updateStatus(ownerId, id, dto) {
        const cheque = await this.findOne(ownerId, id);
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
            include: { lease: true, tenant: true, property: true, unit: true },
        });
    }
    async upcoming(ownerId, days, propertyId) {
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + days);
        const where = {
            ownerId,
            chequeDate: { gte: from, lte: to },
        };
        if (propertyId)
            where.propertyId = propertyId;
        return this.prisma.cheque.findMany({
            where,
            include: { lease: true, tenant: true, property: true, unit: true },
            orderBy: { chequeDate: 'asc' },
        });
    }
    async remove(ownerId, id) {
        await this.findOne(ownerId, id);
        await this.prisma.cheque.delete({ where: { id } });
        return { deleted: true };
    }
    assertValidTransition(current, next, replacedByChequeId) {
        const allowed = VALID_TRANSITIONS[current];
        if (!allowed?.includes(next))
            throw new common_1.BadRequestException(`Invalid status transition from ${current} to ${next}`);
        if (next === client_1.ChequeStatus.REPLACED && !replacedByChequeId)
            throw new common_1.BadRequestException('replacedByChequeId required when status is REPLACED');
    }
    async ensureLeaseOwned(ownerId, leaseId) {
        const lease = await this.prisma.lease.findFirst({ where: { id: leaseId, ownerId } });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
    }
};
exports.ChequesService = ChequesService;
exports.ChequesService = ChequesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChequesService);
//# sourceMappingURL=cheques.service.js.map