import { Module } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { LeaseDocumentsService } from './lease-documents.service';
import { LeaseDocumentsController } from './lease-documents.controller';

@Module({
  controllers: [LeasesController, LeaseDocumentsController],
  providers: [LeasesService, LeaseDocumentsService],
  exports: [LeasesService],
})
export class LeasesModule {}
