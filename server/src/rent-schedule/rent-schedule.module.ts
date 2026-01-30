import { Module } from '@nestjs/common';
import { RentScheduleService } from './rent-schedule.service';
import { RentScheduleController } from './rent-schedule.controller';

@Module({
  controllers: [RentScheduleController],
  providers: [RentScheduleService],
  exports: [RentScheduleService],
})
export class RentScheduleModule {}
