import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController, UnitsByIdController } from './units.controller';

@Module({
  controllers: [UnitsController, UnitsByIdController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
