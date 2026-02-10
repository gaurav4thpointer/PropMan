import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccessModule } from './access/access.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { TenantsModule } from './tenants/tenants.module';
import { LeasesModule } from './leases/leases.module';
import { RentScheduleModule } from './rent-schedule/rent-schedule.module';
import { ChequesModule } from './cheques/cheques.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { AppConfigModule } from './config/config.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccessModule,
    AuthModule,
    UsersModule,
    AdminModule,
    AppConfigModule,
    PropertiesModule,
    TenantsModule,
    LeasesModule,
    RentScheduleModule,
    ChequesModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
