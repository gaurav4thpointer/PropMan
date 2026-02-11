import { Module } from '@nestjs/common';
import { ChequesService } from './cheques.service';
import { ChequesController } from './cheques.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [ChequesController],
  providers: [ChequesService],
  exports: [ChequesService],
})
export class ChequesModule {}
