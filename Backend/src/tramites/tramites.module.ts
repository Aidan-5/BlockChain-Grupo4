import { Module } from '@nestjs/common';
import { TramitesController } from './tramites.controller';
import { TramitesService } from './tramites.service';

@Module({
  controllers: [TramitesController],
  providers: [TramitesService],
})
export class TramitesModule {}
