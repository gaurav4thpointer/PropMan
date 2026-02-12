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
exports.ChequesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cheques_service_1 = require("./cheques.service");
const create_cheque_dto_1 = require("./dto/create-cheque.dto");
const update_cheque_dto_1 = require("./dto/update-cheque.dto");
const cheque_status_dto_1 = require("./dto/cheque-status.dto");
const cheque_query_dto_1 = require("./dto/cheque-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ChequesController = class ChequesController {
    constructor(chequesService) {
        this.chequesService = chequesService;
    }
    create(user, dto) {
        return this.chequesService.create(user.id, user.role, dto);
    }
    findAll(user, query) {
        const { page, limit, ...filters } = query;
        return this.chequesService.findAll(user.id, user.role, { page, limit }, filters);
    }
    upcoming(user, days, propertyId) {
        const d = days === '60' ? 60 : days === '90' ? 90 : 30;
        return this.chequesService.upcoming(user.id, user.role, d, propertyId);
    }
    findOne(user, id) {
        return this.chequesService.findOne(user.id, user.role, id);
    }
    update(user, id, dto) {
        return this.chequesService.update(user.id, user.role, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.chequesService.updateStatus(user.id, user.role, id, dto);
    }
    archive(user, id) {
        return this.chequesService.archive(user.id, user.role, id);
    }
    restore(user, id) {
        return this.chequesService.restore(user.id, user.role, id);
    }
    remove(user, id) {
        return this.chequesService.remove(user.id, user.role, id);
    }
};
exports.ChequesController = ChequesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create cheque (PDC)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_cheque_dto_1.CreateChequeDto]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List cheques with filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cheque_query_dto_1.ChequeQueryDto]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, swagger_1.ApiOperation)({ summary: 'Upcoming cheque dates (30/60/90 days)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "upcoming", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cheque by ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update cheque' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_cheque_dto_1.UpdateChequeDto]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update cheque status (validated transitions)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cheque_status_dto_1.ChequeStatusUpdateDto]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive cheque' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "archive", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore archived cheque' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete cheque' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChequesController.prototype, "remove", null);
exports.ChequesController = ChequesController = __decorate([
    (0, swagger_1.ApiTags)('cheques'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cheques'),
    __metadata("design:paramtypes", [cheques_service_1.ChequesService])
], ChequesController);
//# sourceMappingURL=cheques.controller.js.map