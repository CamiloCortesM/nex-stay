import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [PrismaModule, ReservationsModule],
  providers: [RoomsResolver, RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
