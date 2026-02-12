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
exports.LeasesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leases_service_1 = require("./leases.service");
const create_lease_dto_1 = require("./dto/create-lease.dto");
const update_lease_dto_1 = require("./dto/update-lease.dto");
const terminate_lease_dto_1 = require("./dto/terminate-lease.dto");
const lease_query_dto_1 = require("./dto/lease-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let LeasesController = class LeasesController {
    constructor(leasesService) {
        this.leasesService = leasesService;
    }
    create(user, dto) {
        return this.leasesService.create(user.id, user.role, dto);
    }
    findAll(user, query) {
        const { page, limit, ...filters } = query;
        return this.leasesService.findAll(user.id, user.role, { page, limit }, filters);
    }
    findOne(user, id) {
        return this.leasesService.findOne(user.id, user.role, id);
    }
    getCascadeInfo(user, id) {
        return this.leasesService.getCascadeInfo(user.id, user.role, id);
    }
    terminateEarly(user, id, dto) {
        return this.leasesService.terminateEarly(user.id, user.role, id, dto);
    }
    archive(user, id) {
        return this.leasesService.archive(user.id, user.role, id);
    }
    restore(user, id) {
        return this.leasesService.restore(user.id, user.role, id);
    }
    update(user, id, dto) {
        return this.leasesService.update(user.id, user.role, id, dto);
    }
    remove(user, id) {
        return this.leasesService.remove(user.id, user.role, id);
    }
};
exports.LeasesController = LeasesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create lease (generates rent schedule)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_lease_dto_1.CreateLeaseDto]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List leases' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, lease_query_dto_1.LeaseQueryDto]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get lease with rent schedule' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/cascade-info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cascade info for lease' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "getCascadeInfo", null);
__decorate([
    (0, common_1.Patch)(':id/terminate'),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate lease early' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, terminate_lease_dto_1.TerminateLeaseDto]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "terminateEarly", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive lease with cascade' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "archive", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore archived lease with cascade' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "restore", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update lease (regenerates rent schedule)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_lease_dto_1.UpdateLeaseDto]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete lease' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "remove", null);
exports.LeasesController = LeasesController = __decorate([
    (0, swagger_1.ApiTags)('leases'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('leases'),
    __metadata("design:paramtypes", [leases_service_1.LeasesService])
], LeasesController);
//# sourceMappingURL=leases.controller.js.map