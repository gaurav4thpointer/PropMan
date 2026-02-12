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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_service_1 = require("../access/access.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let TenantsService = class TenantsService {
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
                throw new common_1.ForbiddenException('You cannot create tenants for this owner');
            ownerId = providedOwnerId;
        }
        else {
            throw new common_1.ForbiddenException('Only owners or property managers can create tenants');
        }
        const { ownerId: _omit, propertyId: _p, ...rest } = dto;
        return this.prisma.tenant.create({
            data: { ...rest, ownerId },
        });
    }
    async findAll(userId, role, pagination, search, includeArchived) {
        const { page = 1, limit = 20 } = pagination;
        const accessiblePropertyIds = await this.accessService.getAccessiblePropertyIds(userId, role);
        let visibilityOr = [];
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            visibilityOr.push({ ownerId: userId });
            if (accessiblePropertyIds.length > 0) {
                visibilityOr.push({
                    leases: {
                        some: {
                            propertyId: { in: accessiblePropertyIds },
                        },
                    },
                });
            }
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const managedOwnerIds = await this.accessService.getManagedOwnerIds(userId);
            if (managedOwnerIds.length === 0 && accessiblePropertyIds.length === 0) {
                return (0, pagination_dto_1.paginatedResponse)([], 0, page, limit);
            }
            if (managedOwnerIds.length > 0) {
                visibilityOr.push({ ownerId: { in: managedOwnerIds } });
            }
            if (accessiblePropertyIds.length > 0) {
                visibilityOr.push({
                    leases: {
                        some: {
                            propertyId: { in: accessiblePropertyIds },
                        },
                    },
                });
            }
        }
        else {
            return (0, pagination_dto_1.paginatedResponse)([], 0, page, limit);
        }
        const andConditions = [{ OR: visibilityOr }];
        if (!includeArchived) {
            andConditions.push({ archivedAt: null });
        }
        if (search?.trim()) {
            const q = search.trim();
            andConditions.push({
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                ],
            });
        }
        const where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
        const [data, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.tenant.count({ where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            if (tenant.ownerId !== userId) {
                const hasLease = await this.prisma.lease.findFirst({
                    where: { tenantId: id, ownerId: userId },
                    select: { id: true },
                });
                if (!hasLease)
                    throw new common_1.NotFoundException('Tenant not found');
            }
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
            if (!canManage)
                throw new common_1.NotFoundException('Tenant not found');
        }
        else {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async update(userId, role, id, dto) {
        const tenant = await this.findOne(userId, role, id);
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            if (tenant.ownerId !== userId)
                throw new common_1.ForbiddenException('You cannot modify this tenant');
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
            if (!canManage)
                throw new common_1.ForbiddenException('You cannot modify this tenant');
        }
        return this.prisma.tenant.update({ where: { id }, data: dto });
    }
    async remove(userId, role, id) {
        const tenant = await this.findOne(userId, role, id);
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            if (tenant.ownerId !== userId)
                throw new common_1.ForbiddenException('You cannot delete this tenant');
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
            if (!canManage)
                throw new common_1.ForbiddenException('You cannot delete this tenant');
        }
        await this.prisma.tenant.delete({ where: { id } });
        return { deleted: true };
    }
    async archive(userId, role, id) {
        const tenant = await this.findOne(userId, role, id);
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            if (tenant.ownerId !== userId)
                throw new common_1.ForbiddenException('You cannot archive this tenant');
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
            if (!canManage)
                throw new common_1.ForbiddenException('You cannot archive this tenant');
        }
        const now = new Date();
        await this.prisma.$transaction([
            this.prisma.tenant.update({ where: { id }, data: { archivedAt: now } }),
            this.prisma.lease.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
            this.prisma.cheque.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
            this.prisma.payment.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
        ]);
        return this.prisma.tenant.findUnique({ where: { id } });
    }
    async restore(userId, role, id) {
        const tenant = await this.findOne(userId, role, id);
        if (role === client_1.UserRole.USER || role === client_1.UserRole.SUPER_ADMIN) {
            if (tenant.ownerId !== userId)
                throw new common_1.ForbiddenException('You cannot restore this tenant');
        }
        else if (role === client_1.UserRole.PROPERTY_MANAGER) {
            const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
            if (!canManage)
                throw new common_1.ForbiddenException('You cannot restore this tenant');
        }
        await this.prisma.$transaction([
            this.prisma.tenant.update({ where: { id }, data: { archivedAt: null } }),
            this.prisma.lease.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
            this.prisma.cheque.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
            this.prisma.payment.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
        ]);
        return this.prisma.tenant.findUnique({ where: { id } });
    }
    async getCascadeInfo(userId, role, id) {
        await this.findOne(userId, role, id);
        const [leaseCount, chequeCount, paymentCount] = await Promise.all([
            this.prisma.lease.count({ where: { tenantId: id } }),
            this.prisma.cheque.count({ where: { tenantId: id } }),
            this.prisma.payment.count({ where: { tenantId: id } }),
        ]);
        return { leases: leaseCount, cheques: chequeCount, payments: paymentCount };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map