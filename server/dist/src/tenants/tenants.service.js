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
        else {
            throw new common_1.ForbiddenException('Only owners can create tenants');
        }
        const { propertyId: _omit, ...rest } = dto;
        return this.prisma.tenant.create({
            data: { ...rest, ownerId },
        });
    }
    async findAll(userId, role, pagination, search) {
        const { page = 1, limit = 20 } = pagination;
        const where = { ownerId: userId };
        if (search?.trim()) {
            const q = search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where: where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.tenant.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(userId, role, id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        if (tenant.ownerId !== userId || (role !== client_1.UserRole.USER && role !== client_1.UserRole.SUPER_ADMIN)) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async update(userId, role, id, dto) {
        await this.findOne(userId, role, id);
        return this.prisma.tenant.update({ where: { id }, data: dto });
    }
    async remove(userId, role, id) {
        await this.findOne(userId, role, id);
        await this.prisma.tenant.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        access_service_1.AccessService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map