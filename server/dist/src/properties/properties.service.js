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
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let PropertiesService = class PropertiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, dto) {
        return this.prisma.property.create({
            data: { ...dto, ownerId },
            include: { units: true },
        });
    }
    async findAll(ownerId, pagination) {
        const { page = 1, limit = 20 } = pagination;
        const [data, total] = await Promise.all([
            this.prisma.property.findMany({
                where: { ownerId },
                include: { units: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.property.count({ where: { ownerId } }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(ownerId, id) {
        const property = await this.prisma.property.findFirst({
            where: { id, ownerId },
            include: { units: true },
        });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        return property;
    }
    async update(ownerId, id, dto) {
        await this.findOne(ownerId, id);
        return this.prisma.property.update({
            where: { id },
            data: dto,
            include: { units: true },
        });
    }
    async remove(ownerId, id) {
        await this.findOne(ownerId, id);
        await this.prisma.property.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map