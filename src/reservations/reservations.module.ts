import { Module } from '@nestjs/common';
import { ReservationsResolver } from './reservations.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PricingService } from './pricing.service';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [PrismaModule],
  providers: [ReservationsResolver, ReservationsService, PricingService],
  exports: [ReservationsService, PricingService],
})
export class ReservationsModule {}
