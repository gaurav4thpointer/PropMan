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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentScheduleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rent_schedule_service_1 = require("./rent-schedule.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let RentScheduleController = class RentScheduleController {
    constructor(rentScheduleService) {
        this.rentScheduleService = rentScheduleService;
    }
    findByLease(user, leaseId, pagination) {
        return this.rentScheduleService.findByLease(user.id, leaseId, pagination);
    }
    findOverdue(user, propertyId, pagination) {
        return this.rentScheduleService.findOverdue(user.id, propertyId, pagination);
    }
    findOutstanding(user, propertyId, from, to) {
        return this.rentScheduleService.findOutstanding(user.id, propertyId, from, to);
    }
};
exports.RentScheduleController = RentScheduleController;
__decorate([
    (0, common_1.Get)('lease/:leaseId'),
    (0, swagger_1.ApiOperation)({ summary: 'List schedule by lease' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('leaseId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], RentScheduleController.prototype, "findByLease", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, swagger_1.ApiOperation)({ summary: 'List overdue installments' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('propertyId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], RentScheduleController.prototype, "findOverdue", null);
__decorate([
    (0, common_1.Get)('outstanding'),
    (0, swagger_1.ApiOperation)({ summary: 'List outstanding (due/overdue/partial)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('propertyId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], RentScheduleController.prototype, "findOutstanding", null);
exports.RentScheduleController = RentScheduleController = __decorate([
    (0, swagger_1.ApiTags)('rent-schedule'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rent-schedule'),
    __metadata("design:paramtypes", [rent_schedule_service_1.RentScheduleService])
], RentScheduleController);
//# sourceMappingURL=rent-schedule.controller.js.map