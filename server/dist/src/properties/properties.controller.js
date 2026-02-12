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
exports.PropertiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const properties_service_1 = require("./properties.service");
const owners_service_1 = require("../owners/owners.service");
const create_property_dto_1 = require("./dto/create-property.dto");
const update_property_dto_1 = require("./dto/update-property.dto");
const property_query_dto_1 = require("./dto/property-query.dto");
const assign_manager_dto_1 = require("../owners/dto/assign-manager.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let PropertiesController = class PropertiesController {
    constructor(propertiesService, ownersService) {
        this.propertiesService = propertiesService;
        this.ownersService = ownersService;
    }
    create(user, dto) {
        return this.propertiesService.create(user.id, user.role, dto);
    }
    findAll(user, query) {
        const { page, limit, ...filters } = query;
        return this.propertiesService.findAll(user.id, user.role, { page, limit }, filters);
    }
    getPropertyManagers(user, id) {
        return this.ownersService.getManagersForProperty(id, user.id, user.role);
    }
    findOne(user, id) {
        return this.propertiesService.findOne(user.id, user.role, id);
    }
    getCascadeInfo(user, id) {
        return this.propertiesService.getCascadeInfo(user.id, user.role, id);
    }
    update(user, id, dto) {
        return this.propertiesService.update(user.id, user.role, id, dto);
    }
    archive(user, id) {
        return this.propertiesService.archive(user.id, user.role, id);
    }
    restore(user, id) {
        return this.propertiesService.restore(user.id, user.role, id);
    }
    remove(user, id) {
        return this.propertiesService.remove(user.id, user.role, id);
    }
    assignManager(user, id, dto) {
        return this.ownersService.assignManagerToProperty(id, dto.managerId, user.id, user.role);
    }
    revokeManager(user, id, managerId) {
        return this.ownersService.revokeManagerFromProperty(id, managerId, user.id, user.role);
    }
};
exports.PropertiesController = PropertiesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a property' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_property_dto_1.CreatePropertyDto]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List properties' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, property_query_dto_1.PropertyQueryDto]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/managers'),
    (0, swagger_1.ApiOperation)({ summary: 'List managers for property (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "getPropertyManagers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get property by ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/cascade-info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cascade info for property (counts of related records)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "getCascadeInfo", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update property' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_property_dto_1.UpdatePropertyDto]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive property with cascade' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "archive", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore archived property with cascade' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete property' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/managers'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign manager to property (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_manager_dto_1.AssignManagerDto]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "assignManager", null);
__decorate([
    (0, common_1.Delete)(':id/managers/:managerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke manager from property (owner only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('managerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PropertiesController.prototype, "revokeManager", null);
exports.PropertiesController = PropertiesController = __decorate([
    (0, swagger_1.ApiTags)('properties'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [properties_service_1.PropertiesService,
        owners_service_1.OwnersService])
], PropertiesController);
//# sourceMappingURL=properties.controller.js.map