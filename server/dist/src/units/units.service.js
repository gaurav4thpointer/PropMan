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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let UnitsService = class UnitsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, propertyId, dto) {
        await this.ensurePropertyOwned(ownerId, propertyId);
        return this.prisma.unit.create({
            data: { ...dto, propertyId },
        });
    }
    async findByProperty(ownerId, propertyId, pagination) {
        await this.ensurePropertyOwned(ownerId, propertyId);
        const { page = 1, limit = 20 } = pagination;
        const [data, total] = await Promise.all([
            this.prisma.unit.findMany({
                where: { propertyId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { unitNo: 'asc' },
            }),
            this.prisma.unit.count({ where: { propertyId } }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOne(ownerId, id) {
        const unit = await this.prisma.unit.findFirst({
            where: { id, property: { ownerId } },
            include: { property: true },
        });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        return unit;
    }
    async update(ownerId, id, dto) {
        await this.findOne(ownerId, id);
        return this.prisma.unit.update({ where: { id }, data: dto });
    }
    async remove(ownerId, id) {
        await this.findOne(ownerId, id);
        await this.prisma.unit.delete({ where: { id } });
        return { deleted: true };
    }
    async ensurePropertyOwned(ownerId, propertyId) {
        const p = await this.prisma.property.findFirst({
            where: { id: propertyId, ownerId },
        });
        if (!p)
            throw new common_1.NotFoundException('Property not found');
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnitsService);
//# sourceMappingURL=units.service.js.map