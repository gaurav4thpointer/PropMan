"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const access_module_1 = require("./access/access.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const properties_module_1 = require("./properties/properties.module");
const tenants_module_1 = require("./tenants/tenants.module");
const leases_module_1 = require("./leases/leases.module");
const rent_schedule_module_1 = require("./rent-schedule/rent-schedule.module");
const cheques_module_1 = require("./cheques/cheques.module");
const payments_module_1 = require("./payments/payments.module");
const reports_module_1 = require("./reports/reports.module");
const admin_module_1 = require("./admin/admin.module");
const config_module_1 = require("./config/config.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            access_module_1.AccessModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            admin_module_1.AdminModule,
            config_module_1.AppConfigModule,
            properties_module_1.PropertiesModule,
            tenants_module_1.TenantsModule,
            leases_module_1.LeasesModule,
            rent_schedule_module_1.RentScheduleModule,
            cheques_module_1.ChequesModule,
            payments_module_1.PaymentsModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map