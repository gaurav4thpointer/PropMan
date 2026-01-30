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
exports.RentScheduleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let RentScheduleService = class RentScheduleService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByLease(ownerId, leaseId, pagination) {
        const { page = 1, limit = 50 } = pagination;
        const [data, total] = await Promise.all([
            this.prisma.rentSchedule.findMany({
                where: { lease: { ownerId, id: leaseId } },
                include: { lease: { select: { id: true, unit: true, tenant: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { dueDate: 'asc' },
            }),
            this.prisma.rentSchedule.count({ where: { lease: { ownerId, id: leaseId } } }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOverdue(ownerId, propertyId, pagination) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const where = {
            lease: { ownerId },
            status: { in: ['DUE', 'PARTIAL'] },
            dueDate: { lt: today },
        };
        if (propertyId)
            where.lease.propertyId = propertyId;
        const { page = 1, limit = 50 } = pagination ?? {};
        const [data, total] = await Promise.all([
            this.prisma.rentSchedule.findMany({
                where,
                include: { lease: { include: { property: true, unit: true, tenant: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { dueDate: 'asc' },
            }),
            this.prisma.rentSchedule.count({ where }),
        ]);
        return (0, pagination_dto_1.paginatedResponse)(data, total, page, limit);
    }
    async findOutstanding(ownerId, propertyId, from, to) {
        const leaseWhere = { ownerId };
        if (propertyId)
            leaseWhere.propertyId = propertyId;
        const dueDateFilter = {};
        if (from)
            dueDateFilter.gte = new Date(from);
        if (to)
            dueDateFilter.lte = new Date(to);
        return this.prisma.rentSchedule.findMany({
            where: {
                lease: leaseWhere,
                status: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
                ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
            },
            include: { lease: { include: { property: true, unit: true, tenant: true } } },
            orderBy: { dueDate: 'asc' },
        });
    }
};
exports.RentScheduleService = RentScheduleService;
exports.RentScheduleService = RentScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RentScheduleService);
//# sourceMappingURL=rent-schedule.service.js.map