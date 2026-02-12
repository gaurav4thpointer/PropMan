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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let PropertiesService = class PropertiesService {
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
    }
    async create(userId, role, dto) {
        let ownerId;
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            ownerId = userId;
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const providedOwnerId = dto.ownerId;
            if (!providedOwnerId)
                throw new common_1.ForbiddenException('Property manager must specify ownerId');
            const canManage = await this.accessService.canManageOwner(userId, providedOwnerId);
            if (!canManage)
                throw new common_1.ForbiddenException('You cannot create properties for this owner');
            ownerId = providedOwnerId;
        }
        else {
            throw new common_1.ForbiddenException('Only owners or property managers can create properties');
        }
        const { ownerId: _omit, ...propertyData } = dto;
        const property = await this.prisma.property.create({
            data: {
                ...propertyData,
                ownerId,
                status: propertyData.status ?? 'VACANT',
            },
        });
        if (role === client_1.UserRole.PROPERTY_MANAGER) {
            await this.prisma.managedProperty.create({
                data: { propertyId: property.id, managerId: userId },
            });
        }
        return property;
    }
    async findAll(userId, role, pagination, filters) {
        const accessibleIds = await this.accessService.getAccessiblePropertyIds(userId, role);
        if (accessibleIds.length === 0) {
            return (0, pagination_dto_1.paginatedResponse)([], 0, pagination.page ?? 1, pagination.limit ?? 20);
        }
        const { page = 1, limit = 20 } = pagination;
        const where = { id: { in: accessibleIds } };
        if (!filters?.includeArchived)
            where.archivedAt = null;
        if (filters?.country)
            where.country = filters.country;
        if (filters?.currency)
            where.currency = filters.currency;
        if (filters?.search?.trim()) {
            const q = filters.search.trim();
            where.AND = [
                { id: { in: accessibleIds } },
                ...(filters?.includeArchived ? [] : [{ archivedAt: null }]),
                { OR: [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }] },
            ];
            delete where.id;
            delete where.archivedAt;
        }
        const [data, total] = await Promise.all([
            this.prisma.property.findMany({
                where: where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.property.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const canAccess = await this.accessService.canAccessProperty(userId, role, id);
        if (!canAccess)
            throw new common_1.NotFoundException('Property not found');
        const property = await this.prisma.property.findUnique({
            where: { id },
        });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        return property;
    }
    async update(userId, role, id, dto) {
        await this.findOne(userId, role, id);
        return this.prisma.property.update({
            where: { id },
            data: dto,
        });
    }
    async remove(userId, role, id) {
        await this.findOne(userId, role, id);
        const isOwner = await this.accessService.isPropertyOwner(userId, id);
        if (!isOwner)
            throw new common_1.ForbiddenException('Only the property owner can delete the property');
        await this.prisma.property.delete({ where: { id } });
        return { deleted: true };
    }
    async archive(userId, role, id) {
        await this.findOne(userId, role, id);
        const now = new Date();
        await this.prisma.$transaction([
            this.prisma.property.update({ where: { id }, data: { archivedAt: now } }),
            this.prisma.lease.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
            this.prisma.cheque.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
            this.prisma.payment.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
        ]);
        return this.prisma.property.findUnique({ where: { id } });
    }
    async restore(userId, role, id) {
        await this.findOne(userId, role, id);
        await this.prisma.$transaction([
            this.prisma.property.update({ where: { id }, data: { archivedAt: null } }),
            this.prisma.lease.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
            this.prisma.cheque.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
            this.prisma.payment.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
        ]);
        return this.prisma.property.findUnique({ where: { id } });
    }
    async getCascadeInfo(userId, role, id) {
        await this.findOne(userId, role, id);
        const [leaseCount, chequeCount, paymentCount] = await Promise.all([
            this.prisma.lease.count({ where: { propertyId: id } }),
            this.prisma.cheque.count({ where: { propertyId: id } }),
            this.prisma.payment.count({ where: { propertyId: id } }),
        ]);
        return { leases: leaseCount, cheques: chequeCount, payments: paymentCount };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map