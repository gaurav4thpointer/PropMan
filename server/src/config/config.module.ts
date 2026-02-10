import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { ConfigController } from './config.controller';

@Module({
  imports: [AdminModule],
  controllers: [ConfigController],
})
export class AppConfigModule {}

